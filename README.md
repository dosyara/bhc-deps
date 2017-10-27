BHC dependency parser.

## Usage

### Console
Run a command from project directory.

`bhc-deps/bin/depslist path/to/file` – prints list of dependencies for the input file.

`bhc-deps/bin/depstree path/to/file` – prints tree of dependencies for the input file.

`bhc-deps/bin/buildbundle path/to/file.concat.css` – build dependency bundle for input static asset.

### Javascript
```
const parseFile = require('bhc-deps/lib/deps-parser');

const deps = parseFile({ filePath: path.resolve(filePath), projectDir: workDir });
```