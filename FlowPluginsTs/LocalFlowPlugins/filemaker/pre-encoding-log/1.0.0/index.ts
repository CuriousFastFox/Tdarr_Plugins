import https from 'https';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
  Ivariables,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import { getFileName } from '../../../../FlowHelpers/1.0.0/fileUtils';

// Create HTTPS agent that ignores SSL certificate errors
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

interface ABAV1Results {
  crf: number;
  vmaf: number;
  size: number;
  duration: number;
}

interface ExtendedVariables extends Ivariables {
  abav1?: ABAV1Results;
}

interface FileMakerErrorResponse {
  response?: {
    data?: {
      messages?: Array<{
        code: string;
        message: string;
      }>;
    };
    status: number;
    statusText: string;
  };
  message: string;
}

const details = (): IpluginDetails => ({
  name: 'FileMaker Pre-Encoding Log',
  description: 'Logs initial encoding parameters to FileMaker database',
  style: {
    borderColor: 'blue',
  },
  tags: 'database,filemaker,logging',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.31.02',
  sidebarPosition: -1,
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
      tooltip: 'Successfully logged to FileMaker',
    },
    {
      number: 2,
      tooltip: 'Failed to log to FileMaker',
    },
  ],
});

const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  try {
    const lib = require('../../../../../methods/lib')();
    const inputs = lib.loadDefaultValues(args.inputs, details);
    const {
      serverUrl, database, layout, username, password,
    } = inputs;

    // Create base64 encoded credentials
    const credentials = Buffer.from(`${username}:${password}`).toString('base64');

    // Get authentication token
    const authResponse = await args.deps.axios({
      method: 'post',
      url: `${serverUrl}/fmi/data/v1/databases/${database}/sessions`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${credentials}`,
      },
      data: {},
      httpsAgent,
    });

    const { token } = authResponse.data.response;

    // Get data from previous plugin
    const abav1Results = (args.variables as ExtendedVariables).abav1;
    if (!abav1Results) {
      throw new Error('No AB-AV1 results found. Please run CRF search plugin first.');
    }

    // Create record in FileMaker
    const createResponse = await args.deps.axios({
      method: 'post',
      url: `${serverUrl}/fmi/data/v1/databases/${database}/layouts/${layout}/records`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      data: {
        fieldData: {
          Filename: getFileName(args.inputFileObj._id),
          CRF: abav1Results.crf,
          PredictedVMAF: abav1Results.vmaf,
          OriginalSize: args.inputFileObj.file_size || 0,
          PredictedSize: abav1Results.size,
          StartTimestamp: new Date().toLocaleString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
          }).replace(',', ''),
          Status: 2,
        },
      },
      httpsAgent,
    });

    if (createResponse.status !== 200) {
      throw new Error(`Failed to create FileMaker record: ${createResponse.statusText}`);
    }

    // Store the recordId in variables
    const { recordId } = createResponse.data.response;
    const updatedVariables = {
      ...args.variables,
      fileMakerRecordId: recordId,
    };

    args.jobLog('Successfully logged initial results to FileMaker');
    args.jobLog(`Stored FileMaker recordId: ${recordId}`);

    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 1,
      variables: updatedVariables,
    };
  } catch (err) {
    const error = err as FileMakerErrorResponse;
    args.jobLog(`Error logging to FileMaker: ${error.message}`);
    if (error.response?.data) {
      args.jobLog(`Response data: ${JSON.stringify(error.response.data)}`);
    }
    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 2,
      variables: args.variables,
    };
  }
};

export {
  details,
  plugin,
};
