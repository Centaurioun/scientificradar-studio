import { ClassicEditor, Essentials, Autoformat, BlockQuote, Bold, Heading, Image, ImageCaption, ImageStyle, ImageToolbar, ImageUpload, Base64UploadAdapter, Indent, Italic, Link, List, MediaEmbed, Paragraph, Table, TableToolbar, CodeBlock, Code } from 'ckeditor5';
import 'ckeditor5/ckeditor5.css';
import katex from 'katex';
import 'katex/dist/katex.min.css';
window.katex = katex;
import '../theme/mathform.css';

import { Math, AutoformatMath } from '../src/index';

/* global document, window */

ClassicEditor
	.create( {
		attachTo: document.querySelector( '#editor' ),
		licenseKey: 'GPL',
		math: {
			engine: 'katex',
			katexRenderOptions: {
				macros: {
					'\\test': '\\mathrel{\\char`≠}'
				}
			}
		},
		plugins: [
			Math,
			AutoformatMath,
			Essentials,
			Autoformat,
			BlockQuote,
			Bold,
			Heading,
			Image,
			ImageCaption,
			ImageStyle,
			ImageToolbar,
			ImageUpload,
			Indent,
			Italic,
			Link,
			List,
			MediaEmbed,
			Paragraph,
			Table,
			TableToolbar,
			CodeBlock,
			Code,
			Base64UploadAdapter
		],
		toolbar: [
			'math',
			'|',
			'heading',
			'|',
			'bold',
			'italic',
			'link',
			'code',
			'bulletedList',
			'numberedList',
			'|',
			'outdent',
			'indent',
			'|',
			'uploadImage',
			'blockQuote',
			'insertTable',
			'mediaEmbed',
			'codeBlock',
			'|',
			'undo',
			'redo'
		],
		image: {
			toolbar: [
				'imageStyle:inline',
				'imageStyle:block',
				'imageStyle:side',
				'|',
				'imageTextAlternative'
			]
		},
		table: {
			contentToolbar: [
				'tableColumn',
				'tableRow',
				'mergeTableCells'
			]
		}
	} )
	.then( editor => {
		window.editor = editor;
		window.console.log( 'CKEditor 5 is ready.', editor );
	} )
	.catch( err => {
		window.mathEditorError = String( err?.stack || err );
		window.console.error( err.stack );
	} );
