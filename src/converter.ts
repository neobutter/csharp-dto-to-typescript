import {
    CSharpFile,
    EmitOptions,
    Emitter,
    FileEmitOptions,
    InterfaceEmitOptions,
    NamespaceEmitOptions
} from "@fluffy-spoon/csharp-to-typescript-generator";
import { Target } from "./model";
import { DefaultEmitOptions } from "@fluffy-spoon/csharp-to-typescript-generator/dist/src/Emitter";

export class Converter {
    private emitter: Emitter | undefined;
    private readonly options: EmitOptions | undefined;
    private filesToConvert: Target[] = [];
    missingImportedPropertyTypes: string[] = [];

    constructor(files: Target[]) {
        this.filesToConvert = files;

        this.options = {
            defaults: <DefaultEmitOptions>{
                namespaceEmitOptions: <NamespaceEmitOptions>{
                    skip: true
                },
                interfaceEmitOptions: <InterfaceEmitOptions>{
                    declare: false
                }
            },
            file: <FileEmitOptions>{
                onAfterParse: this.onAfterParse
            }
        };
    }

    private onAfterParse(file: CSharpFile) {
        const classes = file.getAllClassesRecursively();
        let classNames = [];
        classes.forEach(item => {
            classNames.push(item.name);
            item.properties.forEach(({ type }) => {
                console.log('%s - %s', type.name, type.fullName);
            });
        });
    }

    public convert() {
        this.filesToConvert.forEach(file => {
            this.emitter = new Emitter(file.source);
            return this.emitter.emit(this.options);
        });
    }
}