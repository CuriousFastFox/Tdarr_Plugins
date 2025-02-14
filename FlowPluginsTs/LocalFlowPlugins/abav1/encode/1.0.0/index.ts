import { CLI } from '../../../../FlowHelpers/1.0.0/cliUtils';
import {
  IpluginDetails,
  IpluginInputArgs,
  IpluginOutputArgs,
  Ivariables,
} from '../../../../FlowHelpers/1.0.0/interfaces/interfaces';
import { getPluginWorkDir, getFileName } from '../../../../FlowHelpers/1.0.0/fileUtils';

interface ABAV1Results {
  crf: number;
  vmaf: number;
  size: number;
  duration: number;
}

interface ExtendedVariables extends Ivariables {
  abav1?: ABAV1Results;
}

const details = (): IpluginDetails => ({
  name: 'FFmpeg AV1 NVENC Encode',
  description: 'Encodes video using FFmpeg with AV1 NVENC using calculated CRF value',
  style: {
    borderColor: 'orange',
  },
  tags: 'video,av1,encoder,ffmpeg',
  isStartPlugin: false,
  pType: '',
  requiresVersion: '2.31.02',
  sidebarPosition: 2,
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
});

const plugin = async (args: IpluginInputArgs): Promise<IpluginOutputArgs> => {
  try {
    const lib = require('../../../../../methods/lib')();
    const inputs = lib.loadDefaultValues(args.inputs, details);

    const preset = inputs.preset as string;
    const ffmpegPath = inputs.ffmpegPath as string;

    if (!args.inputFileObj._id) {
      throw new Error('No input file provided');
    }

    const variables = args.variables as ExtendedVariables;

    if (!variables.abav1?.crf) {
      throw new Error('No CRF value found. Please run CRF search plugin first.');
    }

    const { crf } = variables.abav1;
    const outputFilePath = `${getPluginWorkDir(args)}/${getFileName(args.inputFileObj._id)}.av1.mp4`;

    args.jobLog('Starting FFmpeg AV1 NVENC encode');
    args.jobLog(`Using CRF value: ${crf}`);

    const cliArgs = [
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

    const cli = new CLI({
      cli: ffmpegPath,
      spawnArgs: cliArgs,
      spawnOpts: {},
      jobLog: args.jobLog,
      outputFilePath,
      inputFileObj: args.inputFileObj,
      logFullCliOutput: true,
      updateWorker: args.updateWorker,
      args,
    });

    const process = await cli.runCli();

    if (process.cliExitCode !== 0) {
      args.jobLog('FFmpeg encode failed');
      throw new Error('FFmpeg encode failed');
    }

    args.jobLog('FFmpeg encode completed successfully');

    return {
      outputFileObj: {
        _id: outputFilePath,
      },
      outputNumber: 1,
      variables: args.variables,
    };
  } catch (error) {
    args.jobLog(`Error in FFmpeg encode: ${(error as Error).message}`);
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
