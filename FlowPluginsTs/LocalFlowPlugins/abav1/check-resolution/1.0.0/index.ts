import { CLI } from '../../../../FlowHelpers/1.0.0/cliUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
  Ivariables,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

interface ResolutionResults {
  width: number;
  height: number;
}

// Extend the base Ivariables interface
interface ExtendedVariables extends Ivariables {
  resolution?: ResolutionResults;
}

const details = (): IpluginDetails => ({
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
});

const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  try {
    const lib = require('../../../../../methods/lib')();
    const inputs = lib.loadDefaultValues(args.inputs, details);

    const maxWidth = Number(inputs.maxWidth);
    const ffprobePath = inputs.ffprobePath as string;

    if (!args.inputFileObj._id) {
      throw new Error('No input file provided');
    }

    args.jobLog('Checking video resolution');
    const cliArgs = [
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

    const cli = new CLI({
      cli: ffprobePath,
      spawnArgs: cliArgs,
      spawnOpts: {},
      jobLog: args.jobLog,
      outputFilePath: args.inputFileObj._id,
      inputFileObj: args.inputFileObj,
      logFullCliOutput: true,
      updateWorker: args.updateWorker,
      args,
    });

    const process = await cli.runCli();

    if (process.cliExitCode !== 0) {
      args.jobLog('FFprobe resolution check failed');
      throw new Error('FFprobe resolution check failed');
    }

    // Get the output from FFprobe
    const output = process.errorLogFull.join('\n').trim();
    const [width, height] = output.split(',').map(Number);

    if (!width || !height) {
      throw new Error('Could not parse resolution from FFprobe output');
    }

    // Store results in variables
    const newVariables: ExtendedVariables = {
      ...args.variables,
      resolution: {
        width,
        height,
      },
    };

    args.jobLog(`Detected resolution: ${width}x${height}`);
    args.jobLog(`Maximum allowed width: ${maxWidth}`);

    // Determine output based on resolution check
    const outputNumber = width <= maxWidth ? 1 : 2;
    args.jobLog(`Resolution check ${outputNumber === 1 ? 'passed' : 'failed'}`);

    return {
      outputFileObj: args.inputFileObj,
      outputNumber,
      variables: newVariables,
    };
  } catch (error) {
    args.jobLog(`Error in resolution check: ${(error as Error).message}`);
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
