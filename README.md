<h1 align="center">Solidity Renamer</h1>

## Purpose

The Solidity Renamer is a tool designed to preprocess Solidity contracts for machine learning purposes. It provides functionality to format and rename variables and functions in Solidity files in a consistent manner. This preprocessing step is crucial for machine learning algorithms, as it helps ensure that the input data is structured and standardized, which can lead to more accurate and reliable models.

## Installation

Before using the Solidity Renamer, you need to install the necessary dependencies. Navigate to the project directory and run the following command:

```bash
npm install
```

## Usage

After installing the dependencies, you can run the scripts from the command line as follows:

1.  **Comment Remover and Formatter:**

    This script should be run first to format your Solidity files and remove comments.

    ```bash
    node comment_remover_formatter.js /path/to/directory .sol _formatted
    ```

    This will format all `.sol` files in `/path/to/directory`, remove comments, and write the formatted code to new files with `_formatted` added before the file extension. This step is required for the renaming script to work as intended. Otherwise, the location value returned by the parser will not match the actual location in the file.

2.  **Variable and Function Renamer:**

    After running the formatter, you can use this script to rename variables and functions.

    ```bash
    node variable_function_renamer.js /path/to/directory _formatted.sol _renamed
    ```

    This will rename variables and functions in all `_formatted.sol` files in `/path/to/directory`, and write the modified code to new files with `_renamed` added before the file extension.

If no arguments are provided, both scripts will default to processing `.sol` files in the current directory and adding the specified suffixes.

## Limitations and Future Work

- Built-in function signatures: The current version of the tool does not register built-in function signatures.
- User custom types (structs): The tool does not currently handle user-defined types such as structs.
- Built-in structs (member access): The tool does not currently handle built-in structs.
- Library definitions: The tool does not currently handle library definitions.

Please note that this tool is a work in progress.
