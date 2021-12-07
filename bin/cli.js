#!/usr/bin/env node
const { exit } = require('process')
const byejack = require('../lib/index')
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv)).argv

const threshold = argv.threshold || 14
const treeType = argv.actualtree ? 'actual' : 'virtual'
const packages = argv._

if (treeType === 'actual' && packages.length === 0) {
    console.info("Loading the actual tree from disk and not specifying any packages to compare with doesn't make sense.")
    exit(0)
}

if (packages.length === 0 && treeType === 'virtual') {
    console.info('Auditing packages specified in lockfiles (virtual tree).')
}
else {
    console.info(`Auditing package(s) "${packages.join(' ')}", and their dependencies. Comparing to ${treeType} tree.`)
}
console.info(`Warning threshold: ${threshold} days.`)

console.info(argv)

byejack({
    packages, 
    threshold,
    treeType
})