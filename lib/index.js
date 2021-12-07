const { exit } = require('process')
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const Arborist = require('@npmcli/arborist')
const Diff = require('@npmcli/arborist/lib/diff')
const { DateTime, Interval } = require("luxon");

const treeTypes = {
    ACTUAL: 'actual',
    VIRTUAL: 'virtual'
}

const byejack = async ({ packages, threshold: warningThresholdInDays, treeType: loadTreeType = treeTypes.VIRTUAL }) => {
    const arb = new Arborist()
    const now = DateTime.now()
    const tickedBox = '\x1b[32m[ok]\x1b[0m '
    const error = '\x1b[31m[x]\x1b[0m'


    const makeJson = jsonLike => jsonLike.replace(/\s\s([a-zA-Z0-9-]+)(?=:)/g, "\"$1\"").replace(/'/g, '"')
    const isAdded = child => child.action === 'ADD'

    const getNameAndVersionFromTarUrl = url => {
        const parts = url.split('/')
        let namespace, package, packageVersionAndExtension
        if (parts.length < 6 || parts.length > 7) {
            throw new Error(`Unable to parse url: ${url}`)
        }
        if (parts.length === 6){
            [, , , package, , packageVersionAndExtension] = parts
        }
        else {
            [, , , namespace, package, , packageVersionAndExtension] = parts
        }
        const version = packageVersionAndExtension.slice(package.length +1, -4)
        return {namespace, package, version, url}
    }

    const getPublicationDate = async ({ namespace, package, version }) => {
        const name = namespace ? `${namespace}/${package}` : package
        const command = `npm view ${name}@${version} time`
        const { stdout, stderr } = await exec(command);
        let json = makeJson(stdout)
        let result
        try {
            result = JSON.parse(json)[version]
            return result
        }
        catch (e){
            console.warn(e.message)
            console.warn(`The error occured while processing the result of the following command: npm view ${package}@${version} time`)
            return null
        }
    }

    const getAuditResult = ({ package, version, namespace, published, warningThresholdInDays: threshold }) => {
        const pubDate = DateTime.fromISO(published)
        const age = Interval.fromDateTimes(pubDate, now)
        const ageInDays = Math.ceil(age.length('days'))
        const name = namespace ? `${namespace}/${package}` : package
        let message = `${name}@${version} published ${ageInDays} days ago`
        let ok
         if (ageInDays < threshold){
            message = (`${error}   ${message}!`)
            ok = false
        }
        else {
            message = (`${tickedBox} ${message}.`)
            ok = true
        }
        return {message, ok }
    }

    const logAuditResult = ({ message, ok }) => {
        const logFunc = ok ? console.log : console.warn
        logFunc(message)
    }

    const loadedTree = loadTreeType === treeTypes.ACTUAL ? await arb.loadActual() : await arb.loadVirtual()
    let packagesToAdd = []
    if (loadTreeType !== treeTypes.ACTUAL && packages.length === 0) {
        packagesToAdd = Array.from(loadedTree.children, (value) => {
            const parts = value[1].name.split('/')
            let namespace, package
            if (parts.length === 2) {
                [namespace, package] = parts
            }
            else {
                package = parts[0]
                namespace = undefined
            }

            return {
                package,
                namespace,
                url: value[1].resolved,
                version: value[1].version
            }
        })
    }
    else {
        const ideal = await arb.buildIdealTree({ add: packages })
        const diffResult = Diff.calculate({ loadedTree, ideal })
        packagesToAdd = diffResult.children.filter(isAdded).map(pkg => getNameAndVersionFromTarUrl(pkg.resolved))
    }

    console.info(`${packagesToAdd.length} packages would be added by installing the specified packages`)
    const allAuditResults = await Promise.all(packagesToAdd.map(async package => {
        let published = null
        try {
            published = await getPublicationDate(package)
        }
        catch (e){
            console.warn(e.message)
            console.warn(`The error occured while processing the result of the following command: npm view ${package.package}@${package.version} time`)
            return Promise.resolve({ ... package, error: true})
        }
        const resultWithPublicationDate = { ...package, published}
        const auditResult = getAuditResult({ ...resultWithPublicationDate, warningThresholdInDays })
        logAuditResult(auditResult)
        return auditResult
    }))
    const warnings = allAuditResults.filter(result => !result.ok && !result.error)
    if (warnings.length) {
        console.warn('*********************************************')
        console.warn(`Audit produced ${warnings.length} warnings:`)
        warnings.forEach(warning => logAuditResult(warning))
    }
    const errors = allAuditResults.filter(result => result.error)
    if (errors.length) {
        console.warn("\nThe following packages could not be audited:")
        errors.forEach(({ namespace, package }) => console.warn((namespace ? `${namespace}/${package}` : package)))
    }
}

module.exports = byejack