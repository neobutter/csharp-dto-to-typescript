import fs from "fs";
import path from "path";
import {
    CSharpClass,
    CSharpEnum,
    CSharpFile,
    CSharpNamespace,
    Emitter, EnumEmitOptions,
    FileEmitOptions,
    InterfaceEmitOptions,
    NamespaceEmitOptions
} from "@fluffy-spoon/csharp-to-typescript-generator";
import { DefaultEmitOptions } from "@fluffy-spoon/csharp-to-typescript-generator/dist/src/Emitter";

export class ConvertTargetFile {
    private _isParsed: boolean = false;
    private readonly _path: string = '';
    private readonly _outputFilePath: string = '';
    private _contents: string = '';
    private _classes: CSharpClass[] = [];
    private _enums: CSharpEnum[] = [];
    private _missing: string[] = [];

    private readonly primitiveTypes = ['int', 'string', 'bool', 'DateTime', 'List<>', 'decimal', 'Array<>'];

    private options = {
        defaults: <DefaultEmitOptions>{
            namespaceEmitOptions: <NamespaceEmitOptions>{
                skip: true
            },
            interfaceEmitOptions: <InterfaceEmitOptions>{
                declare: true
            },
            enumEmitOptions: <EnumEmitOptions>{
                declare: true
            }
        },
        file: <FileEmitOptions>{
            onAfterParse: this.onAfterParse.bind(this)
        }
    };

    get isParsed() {
        return this._isParsed;
    }

    get path() {
        return this._path;
    }

    get outputFilePath() {
        return this._outputFilePath;
    }

    get missingTypes() {
        return this._missing;
    }

    get contents() {
        return this._contents;
    }

    public constructor(filePath: string, outputPath: string) {
        this._path = filePath;
        this._outputFilePath = outputPath;
    }

    private onAfterParse(file: CSharpFile) {
        this._classes = file.getAllClassesRecursively();
        const classNames = this._classes.map(item => item.name);
        this._classes.forEach(({ properties }) => {
            properties.forEach(({ type }) => {
                if (!classNames.includes(type.name) && !this.primitiveTypes.includes(type.name)) {
                    this._missing.push(type.name);
                }
            })
        })

        file.namespaces.forEach(namespace => {
            this._enums = this._enums.concat(this.getAllEnumsRecursively(namespace));
        });
    }

    private getAllEnumsRecursively(namespace: CSharpNamespace) {
        let enums: CSharpEnum[] = [];
        for (let enumObject of namespace.enums) {
            enums.push(enumObject);
        }

        for (let namespaceObject of namespace.namespaces) {
            enums = enums.concat(this.getAllEnumsRecursively(namespaceObject));
        }

        return enums;
    }

    public parse() {
        if (this._isParsed) {
            throw 'It is already parsed';
        } else {
            const emitter = new Emitter(fs.readFileSync(this._path).toString());
            this._contents = emitter.emit(this.options);
        }

        return this;
    }

    public getIncluded(values: string[]) {
        let result: string[] = [];
        this._classes.forEach(item => {
            if (values.includes(item.name)) {
                result.push(item.name);
            }
        });

        this._enums.forEach(item => {
            if (values.includes(item.name)) {
                result.push(item.name);
            }
        });

        return result;
    }

    public addImportStatement(importFilePath: string, types: string[]) {
        if (types.length) {
            const importStatement = `import { ${ types.join(', ') } } from '${ path.join(path.relative(path.dirname(this._outputFilePath), path.dirname(importFilePath)), path.parse(importFilePath).name) }';\n`;
            this._contents = importStatement + this._contents;
        }
    }

    public replaceDeclareToExport() {
        this._contents = this._contents.replace(/declare interface/gm, 'export interface');
    }

    public addExportToEnums() {
        this._contents = this._contents.replace(/declare enum/gm, 'export enum');
    }

    public addEmptyLineAfterAllImportStatement() {
        this._contents.replace('\';\nexport interface', '\';\n\nexport interface');
    }
}
