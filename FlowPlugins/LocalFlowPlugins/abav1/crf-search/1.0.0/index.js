"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var cliUtils_1 = require("../../../../FlowHelpers/1.0.0/cliUtils");
var details = function () { return ({
    name: 'AB-AV1 CRF Search',
    description: 'Runs AB-AV1 CRF search to find optimal CRF value based on VMAF target',
    style: {
        borderColor: 'orange',
    },
    tags: 'video,av1,vmaf',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.31.02',
    sidebarPosition: 1,
    icon: 'faSearch',
    inputs: [
        {
            label: 'AB-AV1 Path',
            name: 'abav1Path',
            type: 'string',
            defaultValue: 'C:\\tools\\ab-av1\\ab-av1.exe',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Full path to ab-av1 executable',
        },
        {
            label: 'Minimum VMAF Target',
            name: 'minVmaf',
            type: 'number',
            defaultValue: '95', // Changed to string to match interface requirement
            inputUI: {
                type: 'text',
            },
            tooltip: 'Target VMAF score (default: 95)',
        },
        {
            label: 'Encoding Preset',
            name: 'preset',
            type: 'string',
            defaultValue: 'medium',
            inputUI: {
                type: 'dropdown',
                options: ['fast', 'medium', 'slow'],
            },
            tooltip: 'AV1 encoding preset',
        },
    ],
    outputs: [
        {
            number: 1,
            tooltip: 'CRF search completed successfully',
        },
        {
            number: 2,
            tooltip: 'CRF search failed',
        },
    ],
}); };
exports.details = details;
var plugin = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var lib, inputs, minVmaf, preset, abav1Path, cliArgs, cli, process_1, allOutput_1, lines, lastLine, i, regex, match, crf, vmaf, sizeValue, sizeUnit, duration, sizeInMiB, newVariables, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                lib = require('../../../../../methods/lib')();
                inputs = lib.loadDefaultValues(args.inputs, details);
                minVmaf = Number(inputs.minVmaf);
                preset = inputs.preset;
                abav1Path = inputs.abav1Path;
                if (!args.inputFileObj._id) {
                    throw new Error('No input file provided');
                }
                args.jobLog('Starting AB-AV1 CRF search');
                cliArgs = [
                    'crf-search',
                    '-i', args.inputFileObj._id,
                    '--encoder', 'av1_qsv',
                    '--preset', preset,
                    '--min-vmaf', minVmaf.toString(),
                    '--cache', 'false',
                ];
                args.updateWorker({
                    CLIType: abav1Path,
                    preset: cliArgs.join(' '),
                });
                cli = new cliUtils_1.CLI({
                    cli: abav1Path,
                    spawnArgs: cliArgs,
                    spawnOpts: {},
                    jobLog: args.jobLog,
                    outputFilePath: args.inputFileObj._id,
                    inputFileObj: args.inputFileObj,
                    logFullCliOutput: true,
                    updateWorker: args.updateWorker,
                    args: args,
                });
                return [4 /*yield*/, cli.runCli()];
            case 1:
                process_1 = _a.sent();
                if (process_1.cliExitCode !== 0) {
                    args.jobLog('AB-AV1 CRF search failed');
                    throw new Error('AB-AV1 CRF search failed');
                }
                allOutput_1 = '';
                process_1.errorLogFull.forEach(function (log) {
                    allOutput_1 += "".concat(log, "\n");
                });
                args.jobLog("Full output: ".concat(allOutput_1));
                lines = allOutput_1.split('\n');
                lastLine = '';
                // Find the last line that matches our expected pattern
                for (i = lines.length - 1; i >= 0; i -= 1) {
                    if (lines[i].includes('predicted video stream size')) {
                        lastLine = lines[i];
                        break;
                    }
                }
                if (!lastLine) {
                    throw new Error('Could not find CRF search result in output');
                }
                regex = /crf (\d+) VMAF ([\d.]+) predicted video stream size ([\d.]+) (MiB|GiB) \((\d+)%\) taking (\d+) (minutes|seconds)/;
                match = lastLine.match(regex);
                if (!match) {
                    throw new Error("Could not parse AB-AV1 output: ".concat(lastLine));
                }
                crf = match[1], vmaf = match[2], sizeValue = match[3], sizeUnit = match[4], duration = match[6];
                sizeInMiB = parseFloat(sizeValue);
                if (sizeUnit === 'GiB') {
                    sizeInMiB = sizeInMiB * 1024; // Convert GiB to MiB
                }
                newVariables = __assign(__assign({}, args.variables), { abav1: {
                        crf: parseInt(crf, 10),
                        vmaf: parseFloat(vmaf),
                        size: sizeInMiB, // Always stored as MiB
                        duration: parseInt(duration, 10),
                    }, ffmpegCommand: args.variables.ffmpegCommand, flowFailed: args.variables.flowFailed });
                args.jobLog('AB-AV1 CRF search completed successfully');
                args.jobLog("Results: ".concat(JSON.stringify(newVariables.abav1)));
                return [2 /*return*/, {
                        outputFileObj: args.inputFileObj,
                        outputNumber: 1,
                        variables: newVariables,
                    }];
            case 2:
                error_1 = _a.sent();
                args.jobLog("Error in AB-AV1 CRF search: ".concat(error_1.message));
                return [2 /*return*/, {
                        outputFileObj: args.inputFileObj,
                        outputNumber: 2,
                        variables: args.variables,
                    }];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.plugin = plugin;
