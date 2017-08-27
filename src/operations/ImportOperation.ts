import {isObject} from "../utils/types";
import Operation from "./Operation";

export default class ImportOperation extends Operation {

    keyword() {
        return "import";
    }

    process(source: ImportOperationValue, target?: any) {
        // Make sure we have an array of import values
        const importValues: ImportOperationValue[] = Array.isArray(source) ? source : [source];

        // Process and merge sources
        const importResult = importValues.reduce((result: any, importValue) => {

            // Is the Import a file reference?
            if (typeof importValue === "string") {
                return this._processor.loadAndProcessFileByRef(importValue, result);
            }

            // Ignore if no path is found
            if (typeof importValue.path !== "string") {
                return result;
            }

            // Import unprocessed?
            if (importValue.process === false) {
                const object = this._processor.loadFileByRef(importValue.path);
                this._processor.disableKeywordOperations();
                const processResult = this._processor.processSourceInNewScope(object, result);
                this._processor.enableKeywordOperations();
                return processResult;
            }

            // Import processed
            let scopeVariables: any;

            // Process the params property if set
            if (isObject(importValue.params)) {
                scopeVariables = {};
                scopeVariables.$params = this._processor.processSourcePropertyInNewScope(importValue.params, "params");
            }

            // process the file
            return this._processor.loadAndProcessFileByRef(importValue.path, result, scopeVariables);
        }, undefined);

        // Disable operations if we don't have a target
        // because the import result is already processed
        if (target === undefined) {
            this._processor.disableKeywordOperations();
        }

        // Merge with the target
        const result = this._processor.processSourceInNewScope(importResult, target);

        if (target === undefined) {
            this._processor.enableKeywordOperations();
        }

        return result;
    }
}

/*
 * TYPES
 */

export type ImportOperationValue = string // the path to the file to import
    | {
    path: string; // the path to the file to import
    process?: boolean; // indicates if the file should be processed
    params?: any; // the params to pass to the file
};