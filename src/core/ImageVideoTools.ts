// Proste API do obrazów/wideo – placeholder bez dodatkowych natywnych zależności
// Rozszerzalne o expo-image-manipulator / ffmpeg-kit w razie potrzeby

export async function resizeImagePlaceholder(uri: string, width: number, height: number) {
	return { uri, width, height };
}

export async function trimVideoPlaceholder(uri: string, startSec: number, endSec: number) {
	return { uri, startSec, endSec };
}


