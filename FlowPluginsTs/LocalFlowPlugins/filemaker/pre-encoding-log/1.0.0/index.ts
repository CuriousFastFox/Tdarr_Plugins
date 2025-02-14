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

interface ABAV1Results {
  crf: number;
  vmaf: number;
  size: number;
  duration: number;
}

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
  abav1?: ABAV1Results;
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

const makeFileMakerRequest = async (config: FileMakerConfig, data: Record<string, unknown>, token: string, axios: any): Promise<void> => {
  if (!config.recordId) {
    throw new Error('No FileMaker recordId found');
  }

  await axios({
    method: 'patch',
    url: `${config.serverUrl}/fmi/data/v1/databases/${config.database}/layouts/`
         + `${config.layout}/records/${config.recordId}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    data: {
      fieldData: data,
    },
    httpsAgent,
  });
};

const refreshToken = async (config: FileMakerConfig, axios: any): Promise<string> => {
  const credentials = Buffer.from(`${config.username}:${config.password}`).toString('base64');

  const authResponse = await axios({
    method: 'post',
    url: `${config.serverUrl}/fmi/data/v1/databases/${config.database}/sessions`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${credentials}`,
    },
    data: {},
    httpsAgent,
  });

  return authResponse.data.response.token || '';
};

const updateRecord = async (config: FileMakerConfig, data: Record<string, unknown>, axios: any, args: IpluginInputArgs): Promise<{ token: string }> => {
  try {
    if (!config.token) {
      throw new Error('No FileMaker token found');
    }

    args.jobLog('Using existing FileMaker token');
    await makeFileMakerRequest(config, data, config.token, axios);
    return { token: config.token };
  } catch (error) {
    const typedError = error as FileMakerErrorResponse;
    // Check if token expired (401 status)
    if (typedError.response?.status === 401) {
      // Get new token and retry
      args.jobLog('Token expired, requesting new token');
      const newToken = await refreshToken(config, axios);
      args.jobLog('Using new FileMaker token');
      await makeFileMakerRequest(config, data, newToken, axios);
      return { token: newToken };
    }
    throw error;
  }
};

const details = (): IpluginDetails => ({
  name: 'FileMaker Pre-Encoding Log',
  description: 'Updates FileMaker record with pre-encoding analysis results',
  style: {
    borderColor: 'blue',
  },
  tags: 'database,filemaker,logging',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.31.02',
  sidebarPosition: 2,
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
});

const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  try {
    const variables = args.variables as ExtendedVariables;

    // Check for required data
    if (!variables.fileMaker) {
      throw new Error('No FileMaker configuration found. Please run initialization plugin first.');
    }

    if (!variables.abav1) {
      throw new Error('No AB-AV1 results found. Please run CRF search plugin first.');
    }

    // Update record with pre-encoding data
    const result = await updateRecord(
      variables.fileMaker,
      {
        CRF: variables.abav1.crf,
        PredictedVMAF: variables.abav1.vmaf,
        PredictedSize: variables.abav1.size,
        StartTimestamp: new Date().toLocaleString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }).replace(',', ''),
      },
      args.deps.axios,
      args,
    );

    args.jobLog('Successfully updated FileMaker record with pre-encoding results');

    // Create updated config with new token if refreshed
    const updatedConfig: FileMakerConfig = {
      ...variables.fileMaker,
      token: result.token,
    };

    // Maintain the ExtendedVariables type when returning
    const updatedVariables: ExtendedVariables = {
      ...variables,
      fileMaker: updatedConfig,
    };

    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 1,
      variables: updatedVariables,
    };
  } catch (err) {
    const error = err as FileMakerErrorResponse;
    args.jobLog(`Error updating FileMaker record: ${error.message}`);
    if (error.response?.data) {
      args.jobLog(`Response data: ${JSON.stringify(error.response.data)}`);
    }

    // Maintain the ExtendedVariables type in error case as well
    const errorVariables: ExtendedVariables = args.variables as ExtendedVariables;

    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 2,
      variables: errorVariables,
    };
  }
};

export {
  details,
  plugin,
};
