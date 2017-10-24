const parseFile = require('./deps-parser');

function getBundle({ filePath, projectDir }) {
    const fileDeps = parseFile({ filePath, projectDir });
    const extension = filePath.match(/.*\.([a-z]+)$/)[1];

    return getRequiredDeps({ deps: fileDeps, extension });
}

function getRequiredDeps({ deps, extension, flatList = [] }) {
    return deps.reduce((res, fileNode) => {
        if (!flatList.includes(fileNode.file)) {
            flatList.push(fileNode.file);
            const fileDeps = parseNode({fileNode, extension, flatList});

            if (fileDeps && fileDeps.length) {
                res.push.apply(res, fileDeps);
            }
        }

        return res;
    }, []);
}

function parseNode({ fileNode, extension, flatList = [] }) {
    const requireDeps = [];

    if (fileNode.type === 'require' && fileNode.file.match(new RegExp(`.*\\.${extension}$`))) {
        requireDeps.push(fileNode.file);
    }

    if (fileNode.deps) {
        requireDeps.push.apply(requireDeps, getRequiredDeps({ deps: fileNode.deps, extension, flatList }));
    }

    return requireDeps;
}

module.exports = getBundle;