import { ClipboardPipeline } from 'ckeditor5';
import { Plugin, type Editor } from 'ckeditor5';
import { ModelLivePosition as LivePosition, ModelLiveRange as LiveRange } from 'ckeditor5';
import { Undo } from 'ckeditor5';
import { global } from 'ckeditor5';
import { extractDelimiters, hasDelimiters, delimitersCounts } from './utils';

export default class AutoMath extends Plugin {
	public static get requires() {
		return [ ClipboardPipeline, Undo ] as const;
	}

	public static get pluginName() {
		return 'AutoMath' as const;
	}

	private _timeoutId: null | number;
	private _positionToInsert: null | LivePosition;

	constructor( editor: Editor ) {
		super( editor );

		this._timeoutId = null;

		this._positionToInsert = null;
	}

	public init(): void {
		const editor = this.editor;
		const modelDocument = editor.model.document;

		// CKEditor 49 exposes the inserted model range on ClipboardPipeline's
		// contentInsertion event. Listening after the default low-priority insertion
		// avoids inferring the pasted range from the pre-paste selection (which can
		// be collapsed, replaced, or moved while the clipboard pipeline runs).
		this.listenTo( editor.plugins.get( ClipboardPipeline ), 'contentInsertion', ( _event, data ) => {
			if ( data.method !== 'paste' || !data.resultRange ) {
				return;
			}

			const leftLivePosition = LivePosition.fromPosition( data.resultRange.start );
			leftLivePosition.stickiness = 'toPrevious';
			const rightLivePosition = LivePosition.fromPosition( data.resultRange.end );
			rightLivePosition.stickiness = 'toNext';

			this._mathBetweenPositions( leftLivePosition, rightLivePosition );
			leftLivePosition.detach();
			rightLivePosition.detach();
		}, { priority: 'lowest' } );

		editor.commands.get( 'undo' )?.on( 'execute', () => {
			if ( this._timeoutId ) {
				global.window.clearTimeout( this._timeoutId );
				this._positionToInsert?.detach();

				this._timeoutId = null;
				this._positionToInsert = null;
			}
		}, { priority: 'high' } );
	}

	private _mathBetweenPositions(
		leftPosition: LivePosition,
		rightPosition: LivePosition
	) {
		const editor = this.editor;

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const mathConfig = this.editor.config.get( 'math' )!;

		const equationRange = new LiveRange( leftPosition, rightPosition );
		const walker = equationRange.getWalker( { ignoreElementEnd: true } );

		let text = '';

		// Get equation text
		for ( const node of walker ) {
			if ( node.item.is( '$textProxy' ) ) {
				text += node.item.data;
			}
		}

		text = text.trim();

		// Skip if don't have delimiters
		if ( !hasDelimiters( text ) || delimitersCounts( text ) !== 2 ) {
			return;
		}

		const mathCommand = editor.commands.get( 'math' );

		// Do not anything if math element cannot be inserted at the current position
		if ( !mathCommand?.isEnabled ) {
			return;
		}

		this._positionToInsert = LivePosition.fromPosition( leftPosition );

		// With timeout user can undo conversation if want use plain text
		this._timeoutId = global.window.setTimeout( () => {
			editor.model.change( writer => {
				this._timeoutId = null;

				writer.remove( equationRange );

				let insertPosition: LivePosition | null;

				// Check if position where the math element should be inserted is still valid.
				if ( this._positionToInsert?.root.rootName !== '$graveyard' ) {
					insertPosition = this._positionToInsert;
				}

				editor.model.change( innerWriter => {
					const params = Object.assign( extractDelimiters( text ), {
						type: mathConfig.outputType
					} );
					const mathElement = innerWriter.createElement( params.display ? 'mathtex-display' : 'mathtex-inline', params
					);

					editor.model.insertContent( mathElement, insertPosition );

					innerWriter.setSelection( mathElement, 'on' );
				} );

				this._positionToInsert?.detach();
				this._positionToInsert = null;
			} );
		}, 100 );
	}
}
