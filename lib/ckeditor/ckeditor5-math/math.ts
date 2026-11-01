/**
 * @license ISC
 * Copyright (c) Sauli Anto / Centaurioun/ckeditor5-math (pinned upstream commit 6d8a39a181d1a0b233b8676eb47847c9b506ef53).
 */

import { Plugin, Widget } from 'ckeditor5';
import MathUI from './mathui';
import MathEditing from './mathediting';
import AutoMath from './automath';

export default class Math extends Plugin {
  public static get requires() {
    return [MathEditing, MathUI, AutoMath, Widget] as const;
  }

  public static get pluginName() {
    return 'Math' as const;
  }
}
