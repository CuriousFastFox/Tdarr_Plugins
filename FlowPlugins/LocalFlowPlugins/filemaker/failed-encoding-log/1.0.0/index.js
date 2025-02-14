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
// Create HTTPS agent that ignores SSL certificate errors
var httpsAgent = new https_1.default.Agent({
    rejectUnauthorized: false,
});
var makeFileMakerRequest = function (config, data, token, axios) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!config.recordId) {
                    throw new Error('No FileMaker recordId found');
                }
                return [4 /*yield*/, axios({
                        method: 'patch',
                        url: "".concat(config.serverUrl, "/fmi/data/v1/databases/").concat(config.database, "/layouts/")
                            + "".concat(config.layout, "/records/").concat(config.recordId),
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: "Bearer ".concat(token),
                        },
                        data: {
                            fieldData: data,
                        },
                        httpsAgent: httpsAgent,
                    })];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
var refreshToken = function (config, axios) { return __awaiter(void 0, void 0, void 0, function () {
    var credentials, authResponse;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                credentials = Buffer.from("".concat(config.username, ":").concat(config.password)).toString('base64');
                return [4 /*yield*/, axios({
                        method: 'post',
                        url: "".concat(config.serverUrl, "/fmi/data/v1/databases/").concat(config.database, "/sessions"),
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: "Basic ".concat(credentials),
                        },
                        data: {},
                        httpsAgent: httpsAgent,
                    })];
            case 1:
                authResponse = _a.sent();
                return [2 /*return*/, authResponse.data.response.token || ''];
        }
    });
}); };
var updateRecord = function (config, data, axios, args) { return __awaiter(void 0, void 0, void 0, function () {
    var error_1, typedError, newToken;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 6]);
                if (!config.token) {
                    throw new Error('No FileMaker token found');
                }
                args.jobLog('Using existing FileMaker token');
                return [4 /*yield*/, makeFileMakerRequest(config, data, config.token, axios)];
            case 1:
                _b.sent();
                return [2 /*return*/, { token: config.token }];
            case 2:
                error_1 = _b.sent();
                typedError = error_1;
                if (!(((_a = typedError.response) === null || _a === void 0 ? void 0 : _a.status) === 401)) return [3 /*break*/, 5];
                args.jobLog('Token expired, requesting new token');
                return [4 /*yield*/, refreshToken(config, axios)];
            case 3:
                newToken = _b.sent();
                args.jobLog('Using new FileMaker token');
                return [4 /*yield*/, makeFileMakerRequest(config, data, newToken, axios)];
            case 4:
                _b.sent();
                return [2 /*return*/, { token: newToken }];
            case 5: throw error_1;
            case 6: return [2 /*return*/];
        }
    });
}); };
var details = function () { return ({
    name: 'FileMaker Failed Encoding Log',
    description: 'Updates FileMaker record when encoding fails',
    style: {
        borderColor: 'red',
    },
    tags: 'database,filemaker,logging',
    isStartPlugin: false,
    pType: '',
    requiresVersion: '2.31.02',
    sidebarPosition: 4,
    icon: 'faDatabase',
    inputs: [], // No inputs needed as we use stored connection details
    outputs: [
        {
            number: 1,
            tooltip: 'Successfully updated FileMaker record',
        },
        {
            number: 2,
            tooltip: 'Failed to update FileMaker record',
        },
    ],
}); };
exports.details = details;
var plugin = function (args) { return __awaiter(void 0, void 0, void 0, function () {
    var variables, result, updatedConfig, updatedVariables, err_1, error, errorVariables;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                variables = args.variables;
                // Check for required data
                if (!variables.fileMaker) {
                    throw new Error('No FileMaker configuration found. Please run initialization plugin first.');
                }
                return [4 /*yield*/, updateRecord(variables.fileMaker, {
                        EndTimestamp: new Date().toLocaleString('en-US', {
                            month: '2-digit',
                            day: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: true,
                        }).replace(',', ''),
                        Status: 0, // Failed status
                    }, args.deps.axios, args)];
            case 1:
                result = _b.sent();
                args.jobLog('Successfully updated FileMaker record with failed encoding status');
                updatedConfig = __assign(__assign({}, variables.fileMaker), { token: result.token });
                updatedVariables = __assign(__assign({}, variables), { fileMaker: updatedConfig });
                return [2 /*return*/, {
                        outputFileObj: args.inputFileObj,
                        outputNumber: 1,
                        variables: updatedVariables,
                    }];
            case 2:
                err_1 = _b.sent();
                error = err_1;
                args.jobLog("Error updating FileMaker record: ".concat(error.message));
                if ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) {
                    args.jobLog("Response data: ".concat(JSON.stringify(error.response.data)));
                }
                errorVariables = args.variables;
                return [2 /*return*/, {
                        outputFileObj: args.inputFileObj,
                        outputNumber: 2,
                        variables: errorVariables,
                    }];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.plugin = plugin;
