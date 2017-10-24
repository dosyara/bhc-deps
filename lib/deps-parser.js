const { parse } = require('../parser');
const fs = require('fs');
const path = require('path');
const config = require('../config.json');

const DEBUG = 0;

function croak() {
    DEBUG && console.log.apply(console, arguments);
}

function resolveFilePath({ filePath, projectDir, sourceDir }) {
    croak('resolveFilePath:', filePath);

    if (filePath.match(/^.+:.*/)) {
        const [, label, relPath] = filePath.match(/^(.+):(.*)/);
        const overrides = config.labels;

        return path.join(projectDir, overrides[label], relPath);
    } else if (filePath.match(/\./)) {  // fixme: file might not have . in its name
        let absPath = path.join(sourceDir, filePath);

        try {
            fs.statSync(absPath);
            return absPath;
        } catch (e) {
            absPath = '';
        }

        let searchPaths = config.searchPaths.slice();

        let searchPath;
        while (searchPath = searchPaths.shift()) {
            absPath = path.join(projectDir, searchPath, filePath);

            try {
                fs.statSync(absPath);
                break;
            } catch (e) {
                absPath = '';
            }
        }

        return absPath;
    } else {
        // console.log('Not a file: ', filePath);
    }
}

function getDepsAttribute(attributes) {
    return attributes.reduce((res, attr) => {
        if (typeof attr === 'string' && !res) {
            res = attr;
        } else if (attr && attr.name === 'name') {
            res = attr.value;
        } else if (attr && attr.name === 'NAME') {
            res = attr.value;
        }

        return res;
    }, undefined);
}

function getDepsType(tagName) {
    return {
        'TMPL_INCLUDE': 'include',
        'TMPL_REQUIRE': 'require',
        'TMPL_INLINE': 'inline',
    }[tagName];
}

function parseFile({ filePath, projectDir, flatList = [] }) {
    croak('parseFile:', filePath);

    const sourceDir = path.dirname(filePath);
    const fileContent = fs.readFileSync(filePath, 'utf8').toString();
    const fileFlatList = [];
    let parsedDeps;

    try {
        parsedDeps = parse(fileContent);
    } catch (e) {
        throw new Error(`Parse Error in file: ${filePath}`, e);
    }

    return parsedDeps.reduce((fileDeps, depsNode) => {
        const depsAttributeValue = getDepsAttribute(depsNode.attributes);
        const filePath = resolveFilePath({ filePath: depsAttributeValue, projectDir, sourceDir });

        if (filePath) {
            if (!fileFlatList.includes(filePath)) {
                fileFlatList.push(filePath);

                if (flatList.includes(filePath) || isIgnoredFile({ filePath })) {
                    fileDeps.push({
                        file: filePath,
                        type: getDepsType(depsNode.tagName)
                    });
                } else {
                    flatList.push(filePath);
                    fileDeps.push({
                        file: filePath,
                        type: getDepsType(depsNode.tagName),
                        deps: parseFile({ filePath, projectDir, flatList })
                    });
                }
            }
        }

        return fileDeps;
    }, []);
}

function isIgnoredFile({ filePath }) {
    croak('isIgnoredFile:', filePath);

    return config.ignoreFiles.some((ignoredFile) => {
        if (filePath.endsWith(ignoredFile)) return true;
    });
}

module.exports = parseFile;