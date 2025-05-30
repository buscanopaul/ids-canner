# Edge Scanner - React Native ID Scanner App

A React Native Expo application that scans barcodes and QR codes to extract ID information including:
- ID Number
- First Name  
- Last Name
- Middle Initial
- Birthday
- Photo (when available)

## Features

- **Barcode/QR Code Scanning**: Uses device camera to scan various barcode and QR code formats
- **ID Data Parsing**: Automatically extracts structured data from scanned codes
- **Multiple ID Formats**: Supports Philippine IDs, US Driver's Licenses, and generic formats
- **Beautiful UI**: Modern, intuitive interface with animations
- **Data Display**: Shows parsed information in an organized, shareable format
- **Manual Input**: Alternative manual entry option for unscannable IDs

## Installation

1. Install dependencies:
```bash
npm install
# or
bun install
```

2. Run the development server:
```bash
npx expo start
```

## Usage

### Scanning IDs

1. Tap the scanner button (middle button) to activate the camera
2. Point your camera at a barcode or QR code containing ID information
3. The app will automatically detect and parse the data
4. View the extracted information in the results screen

### Sample QR Code Data Formats

To test the scanner, you can generate QR codes with the following sample data formats:

#### Philippine Driver's License Format:
```
A01-23-456789
DELA CRUZ, JUAN M
01/15/1990
REPUBLIC OF THE PHILIPPINES
DRIVER'S LICENSE
```

#### Alternative Philippine Driver's License Format:
```
A12345678901
SANTOS, MARIA C
12/25/1985
DRIVER'S LICENSE
REPUBLIC OF THE PHILIPPINES
```

#### Philippine National ID Format:
```
1234-5678-9012
REYES, JOSE P
03/10/1980
PHILIPPINE IDENTIFICATION SYSTEM
```

#### SSS ID Format:
```
12-3456789-0
GARCIA, ANA L
06/20/1992
SOCIAL SECURITY SYSTEM
```

#### US Driver's License Format (PDF417):
```
ANSI 6360340102DL00410288ZA03290015DLDAQ123456789
DCSDOE
DCTJOHN
DCUM
DBB01151990
```

#### Generic Format:
```
ID: ABC123456789
Name: John M. Doe
Birthday: 01/15/1990
```

### Supported Philippine ID Types

The app can automatically detect and parse the following Philippine ID types:

- **Philippine Driver's License** (A01-23-456789 format)
- **Philippine National ID** (1234-5678-9012 format)
- **SSS ID** (12-3456789-0 format)
- **UMID** (1234-5678901-2 format)
- **PRC License** (PRC-1234567 format)
- **Postal ID** (POST-1234-567890 format)
- **Other Philippine Government IDs**

### Supported Barcode Types

- QR Code
- Code 128
- Code 39  
- EAN-13
- EAN-8
- UPC-A
- UPC-E
- Codabar

## Architecture

- **Scanner Screen**: Main camera interface with barcode detection
- **Data Parser**: Utility functions to extract structured data from raw scan results
- **Results Display**: Modal component showing parsed ID information
- **Manual Input**: Alternative input method for edge cases

## Dependencies

- **expo-camera**: Camera functionality and barcode scanning
- **@expo/vector-icons**: UI icons
- **@clerk/clerk-expo**: Authentication (existing)
- **expo-router**: Navigation
- **react-native-safe-area-context**: Safe area handling

## Development

The app is built with:
- React Native + Expo SDK 52
- Modern React hooks (useState, useEffect, useRef)
- Animated API for smooth UI transitions
- TypeScript-ready architecture

## License

MIT License
