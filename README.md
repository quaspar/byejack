# Byejack
**Warn about npm packages that are too new to be trusted — protect yourself from package hijackers.**

When you perform an `npm install` it can be tricky to know exactly what gets added to your system.
This module can protect you from unknowingly installing packages that haven't yet had time to be vetted by the community.

## Installation

Byejack can be installed either as a global module:

`npm install -g byejack`

or as a project dependency, in which case it should normally be added to the dev dependencies:

`npm install --save-dev byejack`

## Usage
Let's say you want to install the "react" package via npm. If you run `npm install react` it will install the latest stable version of the package. It will also install a number of dependencies. To see what would get installed by the npm install command, you can use Byejack like so:

`byejack react` (if Byejack is installed globally), or

`npx byejack react` (if Byejack is installed locally or is being fetched directly from the registry).

Byejack will then print a nice, readable list of dependencies that would be installed by npm install — taking into consideration what's already in your local node_modules folder. Note that your current working directory should contain a node_modules folder (a package.json and/or package-lock.json may also work).

**Byejack is using the same tools as npm install is using under the hood**, so the resulting list *should* contain the same dependencies as npm install would add. But note that no-one is leaving any guarantees, so you should not use Byejack as a replacement for your own judgement or best bractices for keeping your system safe.

### Warning messages
By default, Byejack displays a warning if a package in the list is younger than 14 days. This can be configured, simply by passing a threshold as a second argument. This will, for example, display a warning if the react package, or any of it's dependencies, is younger than 30 days:

`byejack react 30`


