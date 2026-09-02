export default {
  appId: 'com.jorucarbus.video-downloader-editor',
  productName: 'Video Downloader & Editor',
  directories: {
    output: 'dist',
  },
  files: ['build/**/*', 'electron/**/*', 'package.json'],
  mac: {
    target: 'dmg',
    category: 'public.app-category.video',
  },
  win: {
    target: 'nsis',
  },
  linux: {
    target: 'AppImage',
  },
};
