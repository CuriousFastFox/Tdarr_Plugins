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

interface FileMakerConfig {
  serverUrl: string;
  database: string;
  layout: string;
  username: string;
  password: string;
  token?: string;
  recordId?: string;
}

interface ExtendedVariables extends Ivariables {
  fileMaker?: FileMakerConfig;
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

    // Create initial record with status "in progress"
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
          Status: 2,
          OriginalSize: args.inputFileObj.file_size || 0,
        },
      },
      httpsAgent,
    });

    if (createResponse.status !== 200) {
      throw new Error(`Failed to create FileMaker record: ${createResponse.statusText}`);
    }

    // Store config and token in variables
    const fileMakerConfig: FileMakerConfig = {
      serverUrl,
      database,
      layout,
      username,
      password,
      token,
      recordId: createResponse.data.response.recordId,
    };

    const updatedVariables: ExtendedVariables = {
      ...args.variables,
      fileMaker: fileMakerConfig,
    };

    args.jobLog('Successfully initialized FileMaker record');
    args.jobLog(`Stored FileMaker config and token for record: ${fileMakerConfig.recordId}`);

    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 1,
      variables: updatedVariables,
    };
  } catch (err) {
    const error = err as FileMakerErrorResponse;
    args.jobLog(`Error initializing FileMaker record: ${error.message}`);
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
