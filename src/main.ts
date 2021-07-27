import { CSharpFile, CSharpNamespace, EmitOptions, Emitter, EnumEmitOptions, FileEmitOptions, NamespaceEmitOptions } from "@fluffy-spoon/csharp-to-typescript-generator";
import { DefaultEmitOptions } from "@fluffy-spoon/csharp-to-typescript-generator/dist/src/Emitter";
import { readFileSync, mkdirSync, existsSync, writeFileSync} from "fs";
import path from "path";
import glob from "glob";
import process from "process";

class App {
    constructor() {
        process.chdir('/Users/Stephen/Development/proof-of-concept/PSIX.DTO');

        const fileList = this.getAllFilePath(process.cwd());

        if (!existsSync('./typescript')) {
            mkdirSync('./typescript');
        }

        fileList.forEach(element => {
            const file = readFileSync(element).toString();
            // console.log(this.parse(file));
            const filenameWitoutExtention = path.basename(path.basename(element), path.extname(element));
            writeFileSync(`${process.cwd()}/typescript/${filenameWitoutExtention}.ts`, this.convert(file));
        });
    }

    private getAllFilePath(workingDir: string) {
        return glob.sync(`${workingDir}/**/*.cs`);
    }

    private convert(code: string): string {
        let emitter = new Emitter(code);
        const options = <EmitOptions>{
            defaults: <DefaultEmitOptions>{
                namespaceEmitOptions: <NamespaceEmitOptions>{
                    skip: true
                }
            },
            file: <FileEmitOptions>{
                onAfterParse: (file: CSharpFile) => {
                    console.log(file);
                }
            }
        };

        return emitter.emit(options);
    }
}

export default new App();