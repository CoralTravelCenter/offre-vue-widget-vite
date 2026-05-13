let widgetInstanceCounter = 0;

function createFallbackWidgetInstanceId() {
	widgetInstanceCounter += 1;

	const timestampPart = Date.now().toString(36);
	const counterPart = widgetInstanceCounter.toString(36);
	const randomPart = Math.random().toString(36).slice(2, 10);

	return `offre-${timestampPart}-${counterPart}-${randomPart}`;
}

export function createWidgetInstanceId() {
	if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
		return crypto.randomUUID();
	}

	return createFallbackWidgetInstanceId();
}
