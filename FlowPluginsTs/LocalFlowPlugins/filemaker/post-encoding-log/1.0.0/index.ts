import https from 'https';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
  Ivariables,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

// Create HTTPS agent that ignores SSL certificate errors
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

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
  name: 'FileMaker Post-Encoding Log',
  description: 'Updates FileMaker record with final encoding results',
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
      tooltip: 'Successfully updated FileMaker record',
    },
    {
      number: 2,
      tooltip: 'Failed to update FileMaker record',
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

interface ExtendedVariables extends Ivariables {
  fileMakerRecordId?: string;
}

// Get recordId from variables
const recordId = (args.variables as ExtendedVariables).fileMakerRecordId;
if (!recordId) {
  throw new Error('No FileMaker recordId found in variables. Please ensure pre-encoding log ran successfully.');
}

// Update the record directly using recordId
const updateResponse = await args.deps.axios({
  method: 'patch',
  url: `${serverUrl}/fmi/data/v1/databases/${database}/layouts/${layout}/records/${recordId}`,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  data: {
    fieldData: {
      FinalSize: args.inputFileObj.file_size || 0,
      EndTimestamp: new Date().toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).replace(',', ''),
      Status: 1,
    },
  },
  httpsAgent,
});

if (updateResponse.status !== 200) {
  throw new Error(`Failed to update FileMaker record: ${updateResponse.statusText}`);
}

args.jobLog('Successfully updated FileMaker record');

return {
  outputFileObj: args.inputFileObj,
  outputNumber: 1,
  variables: args.variables,
};
  } catch (err) {
    const error = err as FileMakerErrorResponse;
    args.jobLog(`Error updating FileMaker record: ${error.message}`);
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
