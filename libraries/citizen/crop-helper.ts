import { Frame } from '@react-native-ml-kit/text-recognition';
import * as ImageManipulator from 'expo-image-manipulator';
import { Image } from 'react-native';

export default async function cropImage(uri: string, box: Frame) {

  // Get actual JPEG dimensions
  const { imgWidth, imgHeight } = await new Promise<{ imgWidth: number; imgHeight: number }>(resolve => {
    Image.getSize(uri, (w, h) => resolve({ imgWidth: w, imgHeight: h }));
  });

  if (!imgWidth || !imgHeight) {
    throw new Error("Invalid image dimensions from Image.getSize");
  }

  // Expand crop
  const padX = box.width * 0.17;
  const padY = box.height * 0.4;

  let left = box.left - padX;
  let top = box.top - padY;
  let width = box.width + padX * 2;
  let height = box.height + padY * 2;

  // Clamp to bounds
  left = Math.max(0, left);
  top = Math.max(0, top);
  width = Math.min(imgWidth - left, width);
  height = Math.min(imgHeight - top, height);

  // Round for ImageManipulator
  const crop = {
    originX: Math.round(left),
    originY: Math.round(top),
    width: Math.round(width),
    height: Math.round(height),
  };

  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ crop }],
    { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
  );

  return result.uri;
}