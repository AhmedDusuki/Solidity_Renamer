const parser = require("@solidity-parser/parser");
const fs = require("fs");
const path = require("path");

// Get directory, file ending, suffix, and file extension from command line arguments
const directory = process.argv[2] || ".";
const fileEnding = process.argv[3] || "_formatted.sol";
const suffix = process.argv[4] || "_renamed";
const fileExtension = process.argv[5] || ".sol";

// Initialize counters for variables and functions
let varCounter = 1;
let funCounter = 1;

// Initialize a map for variables and functions
let varMap = {};
let funMap = {};

// Initialize an array for identifiers
let idEntries = [];

let varArray = Object.entries(varMap).map(([key, value]) => ({
  key,
  value,
}));

let lines = [""];

// measure scope depth
function scope_depth(scope) {
  return scope.split("/").length - 1;
}

// Define a function to traverse the AST for variable definitions
function traverse_variable_definitions(node, scope, parent) {
  for (let key in node) {
    if (node[key] && typeof node[key] === "object") {
      if (node[key].type === "VariableDeclaration" && node[key].name) {
        // Rename the variable and add it to the map
        let newName = "VAR" + varCounter++;
        if (!varMap[node[key].name]) {
          varMap[node[key].name] = [];
        }
        let scope_split = scope.split("/");
        scope_split.pop();
        // Check if the parent is a StateVariableDeclaration
        if (parent && parent.type === "StateVariableDeclaration") {
          scope_split.pop();
        }
        let modifiedScope = scope_split.slice(0, -1).join("/");
        varMap[node[key].name].push({
          scope: modifiedScope,
          newName,
          typeName: node[key].typeName.name,
        });
      } else {
        // Recursively traverse child nodes with an updated scope
        traverse_variable_definitions(node[key], scope + key + "/", node);
      }
    }
  }
}

// Define a function to traverse the AST for variable identifiers
function traverse_variable_identifiers(node, scope) {
  for (let key in node) {
    if (node[key] && typeof node[key] === "object") {
      if (node[key].type === "Identifier" && node[key].name) {
        let entry = varArray.find((e) => e.key === node[key].name);
        if (entry) {
          for (let val of entry.value) {
            let scope_x = val.scope;
            let newName = val.newName;
            if (
              scope === scope_x ||
              (scope_depth(scope) > scope_depth(scope_x) &&
                scope.startsWith(scope_x))
            ) {
              node[key].loc.end.column += node[key].name.length;
              idEntries.push({ newName, loc: node[key].loc });
              break;
            }
          }
        }
      } else {
        // Recursively traverse child nodes with an updated scope
        traverse_variable_identifiers(node[key], scope + key + "/");
      }
    }
  }
}

// Define a function to traverse the AST for function definitions
function traverse_function_definitions(node) {
  for (let key in node) {
    if (node[key] && typeof node[key] === "object") {
      if (node[key].type === "FunctionDefinition" && node[key].name) {
        // Rename the function and add it to the map
        let newName = "FUN" + funCounter++;
        if (!funMap[node[key].name]) {
          funMap[node[key].name] = [];
        }
        let parameters = "";
        if (node[key].parameters && node[key].parameters.length > 0) {
          for (let param of node[key].parameters) {
            if (param.typeName && param.typeName.name) {
              parameters += param.typeName.name + "/";
            }
          }
        }
        returnParameters = "";
        if (
          node[key].returnParameters &&
          node[key].returnParameters.length === 1
        ) {
          returnParameters = node[key].returnParameters[0].typeName.name;
        }
        funMap[node[key].name].push({ parameters, newName, returnParameters });

        node[key].loc.start.column += "function ".length;
        node[key].loc.end.column =
          node[key].loc.start.column + node[key].name.length;
        idEntries.push({ newName, loc: node[key].loc });
      } else {
        // Recursively traverse child nodes with an updated scope
        traverse_function_definitions(node[key]);
      }
    }
  }
}

// Define a function to get the parameters of a function call
function getFunctionCallParameters(node, scope) {
  let parameters = "";
  if (node.arguments.length > 0) {
    for (let arg of node.arguments) {
      if (arg.type === "FunctionCall") {
        if (arg.expression.type === "Identifier") {
          // If the argument is a function call, get its return type
          parameters += getFunctionCallReturnType(arg, scope) + "/";
          // Traverse the function call to ensure it gets renamed
          traverse_function_identifiers(node, scope); // need to call with node, not arg, because of how traverse_function_identifiers is written
        } else {
          // else it could be member access like game.player, ignored
        }
      } else if (arg.type === "Identifier") {
        let entry = varArray.find((e) => e.key === arg.name);
        if (entry) {
          for (let val of entry.value) {
            let scope_x = val.scope;
            if (
              scope === scope_x ||
              (scope_depth(scope) > scope_depth(scope_x) &&
                scope.startsWith(scope_x))
            ) {
              parameters += val.typeName + "/";
              break;
            }
          }
        }
      }
    }
  }
  return parameters;
}

// Define a function to get the return type of a function call
function getFunctionCallReturnType(node, scope) {
  let parameters = getFunctionCallParameters(node, scope);
  let funArray = funMap[node.expression.name];

  if (funArray) {
    for (let val of funArray) {
      let parameters_x = val.parameters;
      if (parameters === parameters_x) {
        return val.returnParameters;
      }
    }
  } else {
    // built in function return type
  }
  return "";
}

// Define a function to traverse the AST for function identifiers
function traverse_function_identifiers(node, scope) {
  for (let key in node) {
    if (node[key] && typeof node[key] === "object") {
      if (node[key].type === "FunctionCall" && node[key].expression.name) {
        let parameters = getFunctionCallParameters(node[key], scope);

        let funArray = funMap[node[key].expression.name];
        if (funArray) {
          for (let val of funArray) {
            let parameters_x = val.parameters;
            let newName = val.newName;
            if (parameters === parameters_x) {
              node[key].loc.end.column =
                node[key].loc.start.column + node[key].expression.name.length;
              idEntries.push({ newName, loc: node[key].loc });
              break;
            }
          }
        } else {
          // built in function, ignored
        }
      } else {
        // Recursively traverse child nodes with an updated scope
        traverse_function_identifiers(node[key], scope + key + "/");
      }
    }
  }
}

// Define a sorting function
function sortEntries(a, b) {
  // Compare the start line
  if (a.loc.start.line !== b.loc.start.line) {
    return b.loc.start.line - a.loc.start.line;
  }
  // If the start line is the same, compare the start column
  return b.loc.start.column - a.loc.start.column;
}

// Define a function to replace a name at a specific location in the source code
function replaceName(newName, loc) {
  let { start, end } = loc;
  let line = lines[start.line - 1];
  let prefix = line.substring(0, start.column);
  let suffix = line.substring(end.column);
  let replacement = prefix + newName + suffix;
  lines[start.line - 1] = replacement;
}

// Read the directory
fs.readdir(directory, (err, files) => {
  if (err) {
    console.error(`Error reading directory: ${err}`);
    return;
  }

  // Filter files by ending
  const solidityFiles = files.filter((file) => file.endsWith(fileEnding));

  // Process each file
  solidityFiles.forEach((file) => {
    let sourceCode = fs.readFileSync(path.join(directory, file), "utf8");

    // Parse the source code to get the AST
    let ast = parser.parse(sourceCode, { loc: true });
    // Log the AST
    // console.log(JSON.stringify(ast, null, 2));
    // process.exit();

    // Initialize counters for variables and functions
    varCounter = 1;
    funCounter = 1;

    // Initialize a map for variables and functions
    varMap = {};
    funMap = {};

    // Initialize an array for identifiers
    idEntries = [];

    // Traverse the AST to go over variables definitions
    traverse_variable_definitions(ast, "", null);

    // sort varMap deepest scope first
    // Convert varMap to an array
    varArray = Object.entries(varMap).map(([key, value]) => ({
      key,
      value,
    }));

    // Sort varArray by scope depth
    varArray.sort((a, b) => {
      // Get the deepest scope in a's value array
      let maxDepthA = Math.max(...a.value.map((val) => scope_depth(val.scope)));
      // Get the deepest scope in b's value array
      let maxDepthB = Math.max(...b.value.map((val) => scope_depth(val.scope)));
      // Compare the two depths
      return maxDepthB - maxDepthA;
    });

    // Now varArray is sorted by scope depth
    // console.log(util.inspect(varArray, { depth: null }));

    // Traverse the AST to rename variables
    traverse_variable_identifiers(ast, "");

    // Traverse the AST to go over function definitions
    traverse_function_definitions(ast);
    // console.log(util.inspect(funMap, { depth: null }));

    // Traverse the AST to rename functions
    traverse_function_identifiers(ast, "");

    // Sort allEntries in descending order according to the location
    idEntries.sort(sortEntries);

    // console.log(util.inspect(idEntries, { depth: null }));

    // Split the source code into lines
    lines = sourceCode.split("\n");

    // Iterate through the sorted entries to replace each variable name
    for (let entry of idEntries) {
      replaceName(entry.newName, entry.loc);
    }

    // Join the lines back into source code
    sourceCode = lines.join("\n");

    // Write the modified source code back to the file with suffix
    fs.writeFileSync(
      path.join(
        directory,
        path.basename(file, fileExtension) + suffix + fileExtension
      ),
      sourceCode
    );
  });
});
