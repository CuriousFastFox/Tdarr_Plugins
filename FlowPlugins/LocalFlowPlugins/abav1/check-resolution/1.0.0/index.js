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
    name: 'Resolution Check',
    description: 'Checks if video resolution exceeds specified maximum width',
    style: {
        borderColor: 'blue',
    },
    tags: 'video,resolution,ffprobe',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.31.02',
    sidebarPosition: 1,
    icon: 'faRuler',
    inputs: [
        {
            label: 'FFprobe Path',
            name: 'ffprobePath',
            type: 'string',
            defaultValue: 'ffprobe',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Path to ffprobe executable',
        },
        {
            label: 'Maximum Width',
            name: 'maxWidth',
            type: 'number',
            defaultValue: '1920',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Maximum allowed video width in pixels',
        },
    ],
    outputs: [
        {
            number: 1,
            tooltip: 'Video resolution is within limits',
        },
        {
            number: 2,
            tooltip: 'Video resolution exceeds maximum width',
        },
    ],
}); };
exports.details = details;
var plugin = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var lib, inputs, maxWidth, ffprobePath, cliArgs, cli, process_1, output, _a, width, height, newVariables, outputNumber, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                lib = require('../../../../../methods/lib')();
                inputs = lib.loadDefaultValues(args.inputs, details);
                maxWidth = Number(inputs.maxWidth);
                ffprobePath = inputs.ffprobePath;
                if (!args.inputFileObj._id) {
                    throw new Error('No input file provided');
                }
                args.jobLog('Checking video resolution');
                cliArgs = [
                    '-v', 'error',
                    '-select_streams', 'v:0',
                    '-show_entries', 'stream=width,height',
                    '-of', 'csv=p=0',
                    args.inputFileObj._id,
                ];
                args.updateWorker({
                    CLIType: ffprobePath,
                    preset: cliArgs.join(' '),
                });
                cli = new cliUtils_1.CLI({
                    cli: ffprobePath,
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
                process_1 = _b.sent();
                if (process_1.cliExitCode !== 0) {
                    args.jobLog('FFprobe resolution check failed');
                    throw new Error('FFprobe resolution check failed');
                }
                output = process_1.errorLogFull.join('\n').trim();
                _a = output.split(',').map(Number), width = _a[0], height = _a[1];
                if (!width || !height) {
                    throw new Error('Could not parse resolution from FFprobe output');
                }
                newVariables = __assign(__assign({}, args.variables), { resolution: {
                        width: width,
                        height: height,
                    } });
                args.jobLog("Detected resolution: ".concat(width, "x").concat(height));
                args.jobLog("Maximum allowed width: ".concat(maxWidth));
                outputNumber = width <= maxWidth ? 1 : 2;
                args.jobLog("Resolution check ".concat(outputNumber === 1 ? 'passed' : 'failed'));
                return [2 /*return*/, {
                        outputFileObj: args.inputFileObj,
                        outputNumber: outputNumber,
                        variables: newVariables,
                    }];
            case 2:
                error_1 = _b.sent();
                args.jobLog("Error in resolution check: ".concat(error_1.message));
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
