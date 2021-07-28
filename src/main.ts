import { readFileSync, mkdirSync, existsSync, writeFileSync} from "fs";
import { glob } from "glob";
import { Target } from "./model";
import { Converter } from "./converter";
import path from "path";

function bootstrap() {
    const workingDirectory = '/Users/Stephen/Development/proof-of-concept/PSIX.DTO';
    const outputDirectory = './converted';
    process.chdir(workingDirectory);
    const filePathList = glob.sync(`${workingDirectory}/**/*.cs`);

    if (!existsSync(outputDirectory)) {
        mkdirSync(outputDirectory);
    }

    let targetFiles: Target[] = [];

    filePathList.forEach(filePath => {
        // const content = readFileSync(filePath).toString();
        // const filenameWithoutExtension = path.basename(path.basename(content), path.extname(content));

        targetFiles.push({
            filename: path.relative(workingDirectory, filePath),
            source: readFileSync(filePath).toString()
        });
    });

    const converter = new Converter(targetFiles);
    converter.convert();
}

bootstrap();

exports.module = bootstrap;