/**
 * ReadableStream の controller に SSE イベントを送出するユーティリティ。
 * controller をラップし、型安全な send() メソッドを提供する。
 */ export class SSEWriter {
	controller
	encoder
	constructor(controller) {
		this.controller = controller
		this.encoder = new TextEncoder()
	}
	/** SSE イベントを送出 */ send(event) {
		const data = `data: ${JSON.stringify(event)}\n\n`
		this.controller.enqueue(this.encoder.encode(data))
	}
	/** ストリームを閉じる */ close() {
		this.controller.close()
	}
}
