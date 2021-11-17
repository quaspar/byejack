#!/usr/bin/env node
const { exit } = require('process')
const byejack = require('../lib/index')

const defaultThreshold = 14

args = process.argv.splice(2)
if (!args.length) {
    console.log("A package name must be specified")
    exit(0)
}

const [package, warningThresholdInDays = defaultThreshold] = args

console.log(`Auditing package "${package}", and it's dependencies. Warning threshold: ${warningThresholdInDays} days.`)

byejack({
    package, 
    warningThresholdInDays
})