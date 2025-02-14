import { CLI } from '../../../../FlowHelpers/1.0.0/cliUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
  Ivariables,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';

interface ABAV1Results {
  crf: number;
  vmaf: number;
  size: number;
  duration: number;
}

// Extend the base Ivariables interface
interface ExtendedVariables extends Ivariables {
  abav1?: ABAV1Results;
}

const details = (): IpluginDetails => ({
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
});

const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  try {
    const lib = require('../../../../../methods/lib')();
    const inputs = lib.loadDefaultValues(args.inputs, details);

    const minVmaf = Number(inputs.minVmaf);
    const preset = inputs.preset as string;
    const abav1Path = inputs.abav1Path as string;

    if (!args.inputFileObj._id) {
      throw new Error('No input file provided');
    }

    args.jobLog('Starting AB-AV1 CRF search');
    const cliArgs = [
      'crf-search',
      '-i', args.inputFileObj._id,
      '--encoder', 'av1_nvenc',
      '--preset', preset,
      '--min-vmaf', minVmaf.toString(),
      '--cache', 'false',
    ];

    args.updateWorker({
      CLIType: abav1Path,
      preset: cliArgs.join(' '),
    });

    const cli = new CLI({
      cli: abav1Path,
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
      args.jobLog('AB-AV1 CRF search failed');
      throw new Error('AB-AV1 CRF search failed');
    }

    // Get all logged lines from the CLI execution
    let allOutput = '';
    process.errorLogFull.forEach((log: string) => {
      allOutput += `${log}\n`;
    });

    args.jobLog(`Full output: ${allOutput}`);

    // Parse the output to find the line we want
    const lines = allOutput.split('\n');
    let lastLine = '';

    // Find the last line that matches our expected pattern
    for (let i = lines.length - 1; i >= 0; i -= 1) {
      if (lines[i].includes('predicted video stream size')) {
        lastLine = lines[i];
        break;
      }
    }

    if (!lastLine) {
      throw new Error('Could not find CRF search result in output');
    }

    // Parse the final output line using regex
    const regex = /crf (\d+) VMAF ([\d.]+) predicted video stream size ([\d.]+) MiB \((\d+)%\) taking (\d+) minutes/;
    const match = lastLine.match(regex);

    if (!match) {
      throw new Error(`Could not parse AB-AV1 output: ${lastLine}`);
    }

    // Extract values
    const [, crf, vmaf, size, , duration] = match;

    // Store results in variables
    const newVariables: ExtendedVariables = {
      ...args.variables,
      abav1: {
        crf: parseInt(crf, 10),
        vmaf: parseFloat(vmaf),
        size: parseFloat(size),
        duration: parseInt(duration, 10),
      },
      ffmpegCommand: args.variables.ffmpegCommand,
      flowFailed: args.variables.flowFailed,
    };

    args.jobLog('AB-AV1 CRF search completed successfully');
    args.jobLog(`Results: ${JSON.stringify(newVariables.abav1)}`);

    return {
      outputFileObj: args.inputFileObj,
      outputNumber: 1,
      variables: newVariables,
    };
  } catch (error) {
    args.jobLog(`Error in AB-AV1 CRF search: ${(error as Error).message}`);
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
