const fs = require("fs");
const path = require("path");
const prettier = require("prettier");

// Get directory and file extension from command line arguments
const directory = process.argv[2] || ".";
const fileExtension = process.argv[3] || ".sol";
const suffix = process.argv[4] || "_formatted";

// Read the directory
fs.readdir(directory, (err, files) => {
  if (err) {
    console.error(`Error reading directory: ${err}`);
    return;
  }

  // Filter files by extension
  const solidityFiles = files.filter(
    (file) => path.extname(file) === fileExtension
  );

  // Process each file
  solidityFiles.forEach((file) => {
    let sourceCode = fs.readFileSync(path.join(directory, file), "utf8");

    // Regular expression to match strings and comments
    let pattern = new RegExp(
      "(\".*?\"|'.*?')|(\\/\\*.*?\\*\\/|//[^\r\n]*$)",
      "gms"
    );

    // Function to replace matched groups
    sourceCode = sourceCode.replace(pattern, function (match, group1, group2) {
      if (group2) {
        return "";
      } else {
        return group1;
      }
    });

    // Replace multiple whitespaces with single space
    sourceCode = sourceCode.replace(/\s+/g, " ");
    // Remove leading and trailing whitespaces
    sourceCode = sourceCode.replace(/^\s+|\s+$/g, "");

    // Format with prettier
    (async () => {
      const formattedSourceCode = await prettier.format(sourceCode, {
        parser: "solidity-parse",
        plugins: ["prettier-plugin-solidity"],
      });

      // Write the modified source code back to the file with suffix
      fs.writeFileSync(
        path.join(
          directory,
          path.basename(file, fileExtension) + suffix + fileExtension
        ),
        formattedSourceCode
      );
    })();
  });
});
