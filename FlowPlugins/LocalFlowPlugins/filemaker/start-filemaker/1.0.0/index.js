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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.details = void 0;
var https_1 = __importDefault(require("https"));
var fileUtils_1 = require("../../../../FlowHelpers/1.0.0/fileUtils");
// Create HTTPS agent that ignores SSL certificate errors
var httpsAgent = new https_1.default.Agent({
    rejectUnauthorized: false,
});
var details = function () { return ({
    name: 'Start FileMaker',
    description: 'Initializes FileMaker connection and creates initial record',
    style: {
        borderColor: 'green',
    },
    tags: 'database,filemaker,logging',
    isStartPlugin: true,
    pType: '',
    requiresVersion: '2.31.02',
    sidebarPosition: 1,
    icon: 'faDatabase',
    inputs: [
        {
            label: 'FileMaker Server URL',
            name: 'serverUrl',
            type: 'string',
            defaultValue: 'https://your-server.com',
            inputUI: {
                type: 'text',
            },
            tooltip: 'FileMaker Server URL',
        },
        {
            label: 'Database Name',
            name: 'database',
            type: 'string',
            defaultValue: '',
            inputUI: {
                type: 'text',
            },
            tooltip: 'FileMaker database name',
        },
        {
            label: 'Layout',
            name: 'layout',
            type: 'string',
            defaultValue: 'Transcoding',
            inputUI: {
                type: 'text',
            },
            tooltip: 'FileMaker layout name',
        },
        {
            label: 'Username',
            name: 'username',
            type: 'string',
            defaultValue: '',
            inputUI: {
                type: 'text',
            },
            tooltip: 'FileMaker username',
        },
        {
            label: 'Password',
            name: 'password',
            type: 'string',
            defaultValue: '',
            inputUI: {
                type: 'text',
            },
            tooltip: 'FileMaker password',
        },
    ],
    outputs: [
        {
            number: 1,
            tooltip: 'Successfully initialized FileMaker record',
        },
        {
            number: 2,
            tooltip: 'Failed to initialize FileMaker record',
        },
    ],
}); };
exports.details = details;
var plugin = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var lib, inputs, serverUrl, database, layout, username, password, credentials, authResponse, token, resolutionWidth, createResponse, fileMakerConfig, updatedVariables, err_1, error;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 3, , 4]);
                lib = require('../../../../../methods/lib')();
                inputs = lib.loadDefaultValues(args.inputs, details);
                serverUrl = inputs.serverUrl, database = inputs.database, layout = inputs.layout, username = inputs.username, password = inputs.password;
                credentials = Buffer.from("".concat(username, ":").concat(password)).toString('base64');
                return [4 /*yield*/, args.deps.axios({
                        method: 'post',
                        url: "".concat(serverUrl, "/fmi/data/v1/databases/").concat(database, "/sessions"),
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: "Basic ".concat(credentials),
                        },
                        data: {},
                        httpsAgent: httpsAgent,
                    })];
            case 1:
                authResponse = _c.sent();
                token = authResponse.data.response.token;
                resolutionWidth = ((_a = args.variables.resolution) === null || _a === void 0 ? void 0 : _a.width) || null;
                return [4 /*yield*/, args.deps.axios({
                        method: 'post',
                        url: "".concat(serverUrl, "/fmi/data/v1/databases/").concat(database, "/layouts/").concat(layout, "/records"),
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: "Bearer ".concat(token),
                        },
                        data: {
                            fieldData: {
                                Filename: (0, fileUtils_1.getFileName)(args.inputFileObj._id),
                                Resolution: resolutionWidth,
                                Status: 2,
                                OriginalSize: args.inputFileObj.file_size || 0,
                            },
                        },
                        httpsAgent: httpsAgent,
                    })];
            case 2:
                createResponse = _c.sent();
                if (createResponse.status !== 200) {
                    throw new Error("Failed to create FileMaker record: ".concat(createResponse.statusText));
                }
                fileMakerConfig = {
                    serverUrl: serverUrl,
                    database: database,
                    layout: layout,
                    username: username,
                    password: password,
                    token: token,
                    recordId: createResponse.data.response.recordId,
                };
                updatedVariables = __assign(__assign({}, args.variables), { fileMaker: fileMakerConfig });
                args.jobLog('Successfully initialized FileMaker record');
                args.jobLog("Stored FileMaker config and token for record: ".concat(fileMakerConfig.recordId));
                return [2 /*return*/, {
                        outputFileObj: args.inputFileObj,
                        outputNumber: 1,
                        variables: updatedVariables,
                    }];
            case 3:
                err_1 = _c.sent();
                error = err_1;
                args.jobLog("Error initializing FileMaker record: ".concat(error.message));
                if ((_b = error.response) === null || _b === void 0 ? void 0 : _b.data) {
                    args.jobLog("Response data: ".concat(JSON.stringify(error.response.data)));
                }
                return [2 /*return*/, {
                        outputFileObj: args.inputFileObj,
                        outputNumber: 2,
                        variables: args.variables,
                    }];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.plugin = plugin;
