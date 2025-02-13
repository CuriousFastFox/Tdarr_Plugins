"use strict";
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
var fileUtils_1 = require("../../../../FlowHelpers/1.0.0/fileUtils");
var details = function () { return ({
    name: 'FFmpeg AV1 NVENC Encode',
    description: 'Encodes video using FFmpeg with AV1 NVENC using calculated CRF value',
    style: {
        borderColor: 'orange',
    },
    tags: 'video,av1,encoder,ffmpeg',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.31.02',
    sidebarPosition: -1,
    icon: 'faVideoCamera',
    inputs: [
        {
            label: 'FFmpeg Path',
            name: 'ffmpegPath',
            type: 'string',
            defaultValue: 'ffmpeg',
            inputUI: {
                type: 'text',
            },
            tooltip: 'Path to FFmpeg executable',
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
            tooltip: 'Encoding completed successfully',
        },
        {
            number: 2,
            tooltip: 'Encoding failed',
        },
    ],
}); };
exports.details = details;
var plugin = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var lib, inputs, preset, ffmpegPath, variables, crf, outputFilePath, cliArgs, cli, process_1, error_1;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                lib = require('../../../../../methods/lib')();
                inputs = lib.loadDefaultValues(args.inputs, details);
                preset = inputs.preset;
                ffmpegPath = inputs.ffmpegPath;
                if (!args.inputFileObj._id) {
                    throw new Error('No input file provided');
                }
                variables = args.variables;
                if (!((_a = variables.abav1) === null || _a === void 0 ? void 0 : _a.crf)) {
                    throw new Error('No CRF value found. Please run CRF search plugin first.');
                }
                crf = variables.abav1.crf;
                outputFilePath = "".concat((0, fileUtils_1.getPluginWorkDir)(args), "/").concat((0, fileUtils_1.getFileName)(args.inputFileObj._id), ".av1.mp4");
                args.jobLog('Starting FFmpeg AV1 NVENC encode');
                args.jobLog("Using CRF value: ".concat(crf));
                cliArgs = [
                    '-y',
                    '-i', args.inputFileObj._id,
                    '-map', '0',
                    '-c:v', 'copy',
                    '-c:v:0', 'av1_nvenc',
                    '-g', '300',
                    '-cq', crf.toString(),
                    '-pix_fmt', 'yuv420p10le',
                    '-preset', preset,
                    '-c:s', 'copy',
                    '-c:a', 'copy',
                    '-movflags', '+faststart',
                    outputFilePath,
                ];
                args.updateWorker({
                    CLIType: ffmpegPath,
                    preset: cliArgs.join(' '),
                });
                cli = new cliUtils_1.CLI({
                    cli: ffmpegPath,
                    spawnArgs: cliArgs,
                    spawnOpts: {},
                    jobLog: args.jobLog,
                    outputFilePath: outputFilePath,
                    inputFileObj: args.inputFileObj,
                    logFullCliOutput: true,
                    updateWorker: args.updateWorker,
                    args: args,
                });
                return [4 /*yield*/, cli.runCli()];
            case 1:
                process_1 = _b.sent();
                if (process_1.cliExitCode !== 0) {
                    args.jobLog('FFmpeg encode failed');
                    throw new Error('FFmpeg encode failed');
                }
                args.jobLog('FFmpeg encode completed successfully');
                return [2 /*return*/, {
                        outputFileObj: {
                            _id: outputFilePath,
                        },
                        outputNumber: 1,
                        variables: args.variables,
                    }];
            case 2:
                error_1 = _b.sent();
                args.jobLog("Error in FFmpeg encode: ".concat(error_1.message));
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
