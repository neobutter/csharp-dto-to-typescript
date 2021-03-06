import pkg from '../package.json';
import fs from "fs";
import path from "path";
import glob from "glob";
import chalk from "chalk";
import { Command } from "commander";
import { paramCase } from "change-case";
import { ConvertTargetFile } from "./convertTargetFile";
import { Options } from "./models";

function start() {
    new Command()
        .version(pkg.version)
        .argument('<path>', 'Working directory')
        .option('-o, --output-path <path>', 'Output path', 'Converted')
        .option('-l, --lower-case-filename', 'Set output path(filename) to lower case', true)
        .action((path, options) => {
            bootstrap(path, options);
        }).parse(process.argv);
}

function bootstrap(inputPath: string, options: Options) {
    const workingDirectory = path.resolve(inputPath);
    const outputDirectory = path.isAbsolute(options.outputPath) ? options.outputPath : path.resolve(inputPath, options.outputPath);

    const filePathList = glob.sync(`${workingDirectory}/**/*.cs`);

    if (!filePathList.length) {
        console.error('No file to convert');
    }

    const convertTargetFiles: ConvertTargetFile[] = filePathList.map(filePath => new ConvertTargetFile(filePath, getOutputFilePath(filePath, workingDirectory, outputDirectory, options.lowerCaseFilename)).parse());

    // 반복을 돌면서 Import 를 각 파엘에 추가
    convertTargetFiles.forEach(target => {
        for (let temp of convertTargetFiles) {
            if (target.path === temp.path) {
                continue;
            }

            target.addImportStatement(temp.outputFilePath, temp.getIncluded(target.missingTypes));
        }

        target.replaceDeclareToExport();
        target.addExportToEnums();
        target.addEmptyLineAfterAllImportStatement();

        // 파일 Writing
        fs.mkdirSync(path.dirname(target.outputFilePath), { recursive: true });
        fs.writeFileSync(target.outputFilePath, target.contents + '\n');
    })

    console.log(`Total ${chalk.yellow(convertTargetFiles.length)} files are created!`);
}

function getOutputFilePath(value: string, workingDirectory: string, outputDirectory: string, useParamCase: boolean = true) {
    const parsedPath = path.parse(path.relative(workingDirectory, value));
    if (useParamCase) {
        return path.join(outputDirectory, parsedPath.dir.split(path.sep).map(item => paramCase(item)).join(path.sep), paramCase(parsedPath.name) + '.ts')
    } else {
        return path.join(outputDirectory, parsedPath.dir, parsedPath.name + '.ts');
    }
}

start();

exports.module = start;