const { parse } = require('../parser');
const fs = require('fs');
const path = require('path');
const config = require('../config.json');

const DEBUG = +process.env.DEPS_DEBUG || 0;

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

        for (let searchPath of config.searchPaths) {
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

function getFileFromAttribute(attributes) {
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

function isIgnoredFile({ filePath }) {
    croak('isIgnoredFile:', filePath);

    return config.ignoreFiles.some((ignoredFile) => {
        if (filePath.endsWith(ignoredFile)) return true;
    });
}

function getDepsFromTags({ tags, projectDir, sourceDir }) {
    croak('getDepsFromTags:', tags);

    return tags.reduce((fileDeps, tag) => {
        const fileValue = getFileFromAttribute(tag.attributes);
        const filePath = resolveFilePath({ filePath: fileValue, projectDir, sourceDir });

        if (filePath && fileDeps.every(dep => dep.file !== filePath)) {
            fileDeps.push({
                file: filePath,
                type: getDepsType(tag.tagName)
            });
        }

        return fileDeps;
    }, []);
}

function parseFile({ filePath, projectDir, flatList = [] }) {
    croak('parseFile:', filePath);

    const sourceDir = path.dirname(filePath);
    const fileContent = fs.readFileSync(filePath, 'utf8').toString();
    let parsedTags;

    try {
        parsedTags = parse(fileContent);
    } catch (e) {
        throw new Error(`Parse Error in file: ${filePath}`, e);
    }

    return getDepsFromTags({ tags: parsedTags, projectDir, sourceDir }).reduce((fileDeps, depNode) => {
        const depFile = depNode.file;
        const fileDep = {
            file: depFile,
            type: depNode.type,
        };

        if (!flatList.includes(depFile) && !isIgnoredFile({ filePath: depFile })) {
            flatList.push(depFile);
            fileDep.deps = parseFile({ filePath: depFile, projectDir, flatList });
        }

        fileDeps.push(fileDep);

        return fileDeps;
    },[]);
}

module.exports = parseFile;