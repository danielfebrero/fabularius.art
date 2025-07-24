/**
 * Font fingerprinting module
 * Comprehensive font detection system with 500+ font probes
 */

import { safeFeatureDetect, hashData, isBrowser } from "@/lib/fingerprint/utils";
import type { FontFingerprint } from "@/types/fingerprint";

/**
 * Comprehensive font list for detection (500+ fonts)
 */
const FONT_LIST = [
  // Common system fonts
  "Arial",
  "Arial Black",
  "Arial Narrow",
  "Arial Unicode MS",
  "Calibri",
  "Cambria",
  "Candara",
  "Century Gothic",
  "Comic Sans MS",
  "Consolas",
  "Constantia",
  "Corbel",
  "Courier",
  "Courier New",
  "Franklin Gothic Medium",
  "Georgia",
  "Helvetica",
  "Helvetica Neue",
  "Impact",
  "Lucida Console",
  "Lucida Grande",
  "Lucida Sans Unicode",
  "Microsoft Sans Serif",
  "Monaco",
  "Palatino",
  "Palatino Linotype",
  "Segoe UI",
  "Tahoma",
  "Times",
  "Times New Roman",
  "Trebuchet MS",
  "Verdana",
  "Webdings",
  "Wingdings",
  "Wingdings 2",
  "Wingdings 3",

  // Windows fonts
  "Agency FB",
  "Algerian",
  "Book Antiqua",
  "Bookman Old Style",
  "Bradley Hand ITC",
  "Britannic Bold",
  "Broadway",
  "Brush Script MT",
  "Castellar",
  "Century Schoolbook",
  "Colonna MT",
  "Cooper Black",
  "Copperplate Gothic Bold",
  "Copperplate Gothic Light",
  "Curlz MT",
  "Edwardian Script ITC",
  "Elephant",
  "Engravers MT",
  "Eras Bold ITC",
  "Eras Demi ITC",
  "Eras Light ITC",
  "Eras Medium ITC",
  "Felix Titling",
  "Forte",
  "Freestyle Script",
  "French Script MT",
  "Garamond",
  "Gigi",
  "Gill Sans MT",
  "Gill Sans MT Condensed",
  "Gill Sans Ultra Bold",
  "Gloucester MT Extra Condensed",
  "Goudy Old Style",
  "Goudy Stout",
  "Haettenschweiler",
  "Harlow Solid Italic",
  "Harrington",
  "High Tower Text",
  "Informal Roman",
  "Jokerman",
  "Juice ITC",
  "Kristen ITC",
  "Kunstler Script",
  "Wide Latin",
  "Maiandra GD",
  "Matisse ITC",
  "Matura MT Script Capitals",
  "Mistral",
  "Modern No. 20",
  "Monotype Corsiva",
  "MS Outlook",
  "MS Reference Sans Serif",
  "MS Reference Specialty",
  "MT Extra",
  "Niagara Engraved",
  "Niagara Solid",
  "Old English Text MT",
  "Onyx",
  "Parchment",
  "Playbill",
  "Poor Richard",
  "Ravie",
  "Showcard Gothic",
  "Snap ITC",
  "Stencil",
  "Tempus Sans ITC",
  "Viner Hand ITC",
  "Vivaldi",
  "Vladimir Script",
  "Wide Latin",

  // macOS fonts
  "Avenir",
  "Avenir Next",
  "Baskerville",
  "Big Caslon",
  "Bodoni 72",
  "Bodoni 72 Oldstyle",
  "Bodoni 72 Smallcaps",
  "Bradley Hand",
  "Brush Script MT",
  "Chalkboard",
  "Chalkboard SE",
  "Chalkduster",
  "Charter",
  "Cochin",
  "Copperplate",
  "Didot",
  "DIN Alternate",
  "DIN Condensed",
  "Futura",
  "Geneva",
  "Gill Sans",
  "Helvetica Light",
  "Helvetica Neue Light",
  "Herculanum",
  "Hoefler Text",
  "Impact",
  "Iowan Old Style",
  "Kailasa",
  "Kohinoor Bangla",
  "Kohinoor Devanagari",
  "Kohinoor Telugu",
  "Lao Sangam MN",
  "Luminari",
  "Marker Felt",
  "Menlo",
  "Mishafi",
  "Muna",
  "Myanmar MN",
  "Myanmar Sangam MN",
  "Nadeem",
  "New Peninim MT",
  "Noteworthy",
  "Optima",
  "Oriya Sangam MN",
  "Papyrus",
  "Party LET",
  "Phosphate",
  "PingFang HK",
  "PingFang SC",
  "PingFang TC",
  "Plantagenet Cherokee",
  "PT Sans",
  "PT Serif",
  "Rockwell",
  "Savoye LET",
  "SignPainter",
  "Skia",
  "Snell Roundhand",
  "STIXGeneral",
  "STIXIntegralsD",
  "STIXNonUnicode",
  "STIXSizeFiveSym",
  "STIXSizeFourSym",
  "STIXSizeOneSym",
  "STIXSizeThreeSym",
  "STIXSizeTwoSym",
  "STIXVariants",
  "Superclarendon",
  "Thonburi",
  "Times LT MM",
  "Trattatello",
  "Waseem",
  "Zapfino",

  // Linux fonts
  "DejaVu Sans",
  "DejaVu Sans Mono",
  "DejaVu Serif",
  "Droid Sans",
  "Droid Sans Mono",
  "Droid Serif",
  "FreeMono",
  "FreeSans",
  "FreeSerif",
  "Liberation Mono",
  "Liberation Sans",
  "Liberation Serif",
  "Linux Biolinum",
  "Linux Libertine",
  "Noto Sans",
  "Noto Serif",
  "Open Sans",
  "Source Code Pro",
  "Source Sans Pro",
  "Source Serif Pro",
  "Ubuntu",
  "Ubuntu Condensed",
  "Ubuntu Light",
  "Ubuntu Mono",

  // Google Fonts (popular ones)
  "Roboto",
  "Roboto Condensed",
  "Roboto Mono",
  "Roboto Slab",
  "Lato",
  "Montserrat",
  "Oswald",
  "Raleway",
  "PT Sans",
  "PT Serif",
  "Merriweather",
  "Playfair Display",
  "Lora",
  "Nunito",
  "Poppins",
  "Fira Sans",
  "Work Sans",
  "Karla",
  "Crimson Text",
  "Libre Baskerville",

  // Asian fonts
  "SimSun",
  "SimHei",
  "Microsoft YaHei",
  "Microsoft JhengHei",
  "PMingLiU",
  "MingLiU",
  "DFKai-SB",
  "FangSong",
  "KaiTi",
  "NSimSun",
  "STSong",
  "STHeiti",
  "STKaiti",
  "STFangsong",
  "LiSu",
  "YouYuan",
  "STXihei",
  "STZhongsong",
  "FZShuTi",
  "FZYaoti",
  "STCaiyun",
  "STHupo",
  "STLiti",
  "STXingkai",
  "STXinwei",
  "MS Mincho",
  "MS Gothic",
  "MS PMincho",
  "MS PGothic",
  "MS UI Gothic",
  "Yu Gothic",
  "Yu Mincho",
  "Meiryo",
  "Meiryo UI",
  "Malgun Gothic",
  "Gulim",
  "Dotum",
  "Batang",
  "Gungsuh",
  "UnDotum",
  "UnBatang",
  "AppleMyungjo",
  "Apple SD Gothic Neo",

  // Professional fonts
  "Adobe Garamond Pro",
  "Adobe Caslon Pro",
  "Adobe Jenson Pro",
  "Minion Pro",
  "Myriad Pro",
  "Arno Pro",
  "Chaparral Pro",
  "Cronos Pro",
  "Hypatia Sans Pro",
  "Lithos Pro",
  "Mesquite Pro",
  "Minion Pro",
  "Nueva Std",
  "Optima",
  "Prestige Elite Std",
  "Rosewood Std",
  "Stencil Std",
  "Tekton Pro",
  "Trajan Pro",
  "Warnock Pro",

  // Microsoft Office fonts
  "Aptos",
  "Bierstadt",
  "Grandview",
  "Seaford",
  "Skeena",
  "Tenorite",
  "Gill Sans Nova",
  "Neue Haas Grotesk Text Pro",
  "Rockwell Nova",
  "Verdana Pro",
  "Avenir Next LT Pro",
  "DIN 2014",
  "Consolas",

  // Adobe Creative Suite fonts
  "Acumin Pro",
  "Freight Text Pro",
  "Myriad Arabic",
  "Myriad Hebrew",
  "Noto Sans Arabic",
  "Noto Sans Hebrew",
  "Source Han Sans",
  "Source Han Serif",
  "Typeeto Arabic",
  "Adobe Arabic",

  // Specialty and decorative fonts
  "Blackadder ITC",
  "Chiller",
  "Cracked",
  "Curlz MT",
  "Jokerman",
  "Juice ITC",
  "Magneto",
  "Mistral",
  "Papyrus",
  "Pristina",
  "Rage Italic",
  "Ravie",
  "Showcard Gothic",
  "Snap ITC",
  "Tempus Sans ITC",
  "Viner Hand ITC",
  "Vivaldi",

  // Technical and coding fonts
  "Anonymous Pro",
  "DejaVu Sans Mono",
  "Droid Sans Mono",
  "Fira Code",
  "Fira Mono",
  "Hack",
  "Inconsolata",
  "JetBrains Mono",
  "Menlo",
  "Operator Mono",
  "SF Mono",
  "Source Code Pro",
  "Ubuntu Mono",

  // Regional fonts
  "Amiri",
  "Arabic Typesetting",
  "Geeza Pro",
  "Baghdad",
  "DecoType Naskh",
  "Farisi",
  "Geeza Pro",
  "KufiStandardGK",
  "Nadeem",
  "Damascus",
  "Al Bayan",
  "Waseem",
  "Diwan Thuluth",
  "Farah",
  "Baghdad",
  "Simplified Arabic",
  "Traditional Arabic",
  "Arabic Transparent",
  "Aparajita",
  "Kokila",
  "Utsaah",
  "Mangal",
  "Raavi",
  "Shruti",
  "Tunga",
  "Gautami",
  "Kalinga",
  "Kartika",
  "Vijaya",
  "Vrinda",
  "Iskoola Pota",
  "Latha",
  "Vijaya",
  "Akshar Unicode",
  "Angsana New",
  "AngsanaUPC",
  "Browallia New",
  "BrowalliaUPC",
  "Cordia New",
  "CordiaUPC",
  "DilleniaUPC",
  "EucrosiaUPC",
  "FreesiaUPC",
  "IrisUPC",
  "JasmineUPC",
  "KodchiangUPC",
  "LilyUPC",

  // More system fonts
  "Abadi MT Condensed Light",
  "Albertus Extra Bold",
  "Albertus Medium",
  "Antique Olive",
  "Apple Chancery",
  "Apple Color Emoji",
  "Apple Symbols",
  "AppleGothic",
  "AquaKana",
  "Arabic Typesetting",
  "ARCHER",
  "ARNO PRO",
  "Arrus BT",
  "Aurora Cn BT",
  "AvantGarde Bk BT",
  "AvantGarde Md BT",
  "AVENIR",
  "Ayuthaya",
  "Bandy",
  "Bangla Sangam MN",
  "Bank Gothic",
  "BankGothic Md BT",
  "Baskerville Old Face",
  "Bauhaus 93",
  "Beckett",
  "Bell MT",
  "Bembo",
  "Benguiat Bk BT",
  "Berlin Sans FB",
  "Berlin Sans FB Demi",
  "Bernard MT Condensed",
  "BernhardFashion BT",
  "BernhardMod BT",
  "Big Caslon",
  "BinnerD",
  "Blackadder ITC",
  "BlairMdITC TT",
  "Bodoni 72",
  "Bodoni 72 Oldstyle",
  "Bodoni 72 Smallcaps",
  "Bodoni MT",
  "Bodoni MT Black",
  "Bodoni MT Condensed",
  "Bookmark Antiqua",
  "Bookshelf Symbol 7",
  "Boulder",
  "Bradley Hand",
  "Braggadocio",
  "Britannic Bold",
  "Broadway",
  "Brush Script",
  "Californian FB",
  "Calisto MT",
  "Calligrapher",
  "Candara",
  "CaslonOpnface BT",
  "Castellar",
  "Centaur",
  "Cezanne",
  "CG Omega",
  "CG Times",
  "Charlesworth",
  "Charter BT",
  "ChelthmITC Bk BT",
  "Chiller",
  "Clarendon",
  "Clarendon Condensed",
  "CloisterBlack BT",
  "Cochin",
  "Colonna MT",
  "Copperplate",
  "Copperplate Gothic",
  "Copperplate Gothic Bold",
  "Copperplate Gothic Light",
  "CopperplGoth Bd BT",
  "Cornerstone",
  "Coronet",
  "Cuckoo",
  "Curlz MT",
  "CushingITC TT",
  "DaunPenh",
  "Dauphin",
  "David",
  "DB LCD Temp",
  "DELICIOUS",
  "Denmark",
  "DFKai-SB",
  "Didot",
  "DilleniaUPC",
  "DIN",
  "DokChampa",
  "Dotum",
  "DotumChe",
  "Ebrima",
  "Edwardian Script ITC",
  "Elephant",
  "English 111 Vivace BT",
  "Engravers MT",
  "EngraversGothic BT",
  "Eras Bold ITC",
  "Eras Demi ITC",
  "Eras Light ITC",
  "Eras Medium ITC",
  "EucrosiaUPC",
  "Euphemia",
  "Euphemia UCAS",
  "EUROSTILE",
  "Exotc350 Bd BT",
  "FangSong",
  "Felix Titling",
  "Fixedsys",
  "FONTIN",
  "Footlight MT Light",
  "Forte",
  "FrankRuehl",
  "Fransiscan",
  "Freefrm721 Blk BT",
  "FreesiaUPC",
  "Freestyle Script",
  "French Script MT",
  "FrnkGothITC Bk BT",
  "Fruitger",
  "FRUTIGER",
  "Futura",
  "Futura Bk BT",
  "Futura Lt BT",
  "Futura Md BT",
  "Futura ZBlk BT",
  "FuturaBlack BT",
  "Gabriola",
  "Galliard BT",
  "Gautami",
  "Geeza Pro",
  "Geneva",
  "Geometr231 BT",
  "Geometr231 Hv BT",
  "Geometr231 Lt BT",
  "GeoSlab 703 Lt BT",
  "GeoSlab 703 XBd BT",
  "Gigi",
  "Gill Sans",
  "Gill Sans MT",
  "Gill Sans MT Condensed",
  "Gill Sans MT Ext Condensed Bold",
  "Gill Sans Ultra Bold",
  "Gill Sans Ultra Bold Condensed",
  "Gisha",
  "Gloucester MT Extra Condensed",
  "GOTHAM",
  "GOTHAM BOLD",
  "Goudy Old Style",
  "Goudy Stout",
  "GoudyHandtooled BT",
  "GoudyOLSt BT",
  "Gujarati Sangam MN",
  "Gulim",
  "GulimChe",
  "Gungsuh",
  "GungsuhChe",
  "Gurmukhi MN",
  "Haettenschweiler",
  "Harlow Solid Italic",
  "Harrington",
  "Heather",
  "Heiti SC",
  "Heiti TC",
  "HELV",
  "Helvetica",
  "Helvetica Neue",
  "High Tower Text",
  "Hiragino Kaku Gothic ProN",
  "Hiragino Mincho ProN",
  "Hoefler Text",
  "Humanst 521 Cn BT",
  "Humanst521 BT",
  "Humanst521 Lt BT",
  "Imprint MT Shadow",
  "Incised901 Bd BT",
  "Incised901 BT",
  "Incised901 Lt BT",
  "INCONSOLATA",
  "Informal Roman",
  "Informal011 BT",
  "INTERSTATE",
  "IrisUPC",
  "Iskoola Pota",
  "JasmineUPC",
  "Jazz LET",
  "Jenson",
  "Jester",
  "Jokerman",
  "Juice ITC",
  "Kabel Bk BT",
  "Kabel Ult BT",
  "Kailasa",
  "Kalinga",
  "Kannada Sangam MN",
  "Kartika",
  "Kaufmann Bd BT",
  "Kaufmann BT",
  "Khmer UI",
  "KodchiangUPC",
  "Kokila",
  "Korinna BT",
  "Kristen ITC",
  "Krungthep",
  "Kunstler Script",
  "Kuenstler480 BT",
  "KufiStandardGK",
  "Lao UI",
  "Latha",
  "Leelawadee",
  "Letter Gothic",
  "Levenim MT",
  "LilyUPC",
  "Lithograph",
  "Lithograph Light",
  "Long Island",
  "Lydian BT",
  "Magneto",
  "Maiandra GD",
  "Malayalam Sangam MN",
  "Malgun Gothic",
  "Mangal",
  "Marigold",
  "Marion",
  "Marker Felt",
  "Marlett",
  "Matisse ITC",
  "Matura MT Script Capitals",
  "Meiryo",
  "Meiryo UI",
  "Microsoft Himalaya",
  "Microsoft JhengHei",
  "Microsoft New Tai Lue",
  "Microsoft PhagsPa",
  "Microsoft Tai Le",
  "Microsoft Uighur",
  "Microsoft YaHei",
  "Microsoft Yi Baiti",
  "MingLiU",
  "MingLiU_HKSCS",
  "MingLiU_HKSCS-ExtB",
  "MingLiU-ExtB",
  "Minion",
  "Minion Pro",
  "Miriam",
  "Miriam Fixed",
  "Mistral",
  "Modern",
  "Modern No. 20",
  "Mona Lisa Solid ITC TT",
  "Mongolian Baiti",
  "MONO",
  "MoolBoran",
  "Mrs Eaves",
  "MS Gothic",
  "MS LineDraw",
  "MS Mincho",
  "MS PGothic",
  "MS PMincho",
  "MS Reference Sans Serif",
  "MS Reference Specialty",
  "MS UI Gothic",
  "MT Extra",
  "MUSEO",
  "MV Boli",
  "Nadeem",
  "Narkisim",
  "NEVIS",
  "News Gothic",
  "News GothicMT",
  "NewsGoth BT",
  "Niagara Engraved",
  "Niagara Solid",
  "Noteworthy",
  "NSimSun",
  "Nyala",
  "OCR A Extended",
  "Old Century",
  "Old English Text MT",
  "Onyx",
  "Onyx BT",
  "OPTIMA",
  "Oriya Sangam MN",
  "OSAKA",
  "OzHandicraft BT",
  "Palace Script MT",
  "Papyrus",
  "Parchment",
  "Party LET",
  "Pegasus",
  "Perpetua",
  "Perpetua Titling MT",
  "PetitaBold",
  "Pickwick",
  "Plantagenet Cherokee",
  "Playbill",
  "PMingLiU",
  "PMingLiU-ExtB",
  "Poor Richard",
  "Poster",
  "PosterBodoni BT",
  "PRINCETOWN LET",
  "Pristina",
  "PTBarnum BT",
  "Pythagoras",
  "Raavi",
  "Rage Italic",
  "Ravie",
  "Ribbon131 Bd BT",
  "Rockwell",
  "Rockwell Condensed",
  "Rockwell Extra Bold",
  "Rod",
  "Roman",
  "Sakkal Majalla",
  "Santa Fe LET",
  "Savoye LET",
  "Sceptre",
  "Script",
  "Script MT Bold",
  "SCRIPTINA",
  "Serifa",
  "Serifa BT",
  "Serifa Th BT",
  "ShelleyVolante BT",
  "Sherwood",
  "Shonar Bangla",
  "Showcard Gothic",
  "Shruti",
  "Signboard",
  "SILKSCREEN",
  "SimHei",
  "Simplified Arabic",
  "Simplified Arabic Fixed",
  "SimSun",
  "SimSun-ExtB",
  "Sinhala Sangam MN",
  "Sketch Rockwell",
  "Skia",
  "Small Fonts",
  "Snap ITC",
  "Snell Roundhand",
  "Socket",
  "Souvenir Lt BT",
  "Staccato222 BT",
  "Steamer",
  "Stencil",
  "StencilBT",
  "Styllo",
  "Subway",
  "Swis721 BlkEx BT",
  "Swiss911 XCm BT",
  "Sylfaen",
  "Synchro LET",
  "System",
  "Tamil Sangam MN",
  "Technical",
  "Teletype",
  "Telugu Sangam MN",
  "Tempus Sans ITC",
  "Terminal",
  "Thonburi",
  "Traditional Arabic",
  "Trajan",
  "TRAJAN PRO",
  "Tristan",
  "Tubular",
  "Tunga",
  "Tw Cen MT",
  "Tw Cen MT Condensed",
  "Tw Cen MT Condensed Extra Bold",
  "TypoUpright BT",
  "Unicorn",
  "Univers",
  "Univers CE 55 Medium",
  "Univers Condensed",
  "Utsaah",
  "Vagabond",
  "Vani",
  "Vijaya",
  "Viner Hand ITC",
  "VisualUI",
  "Vivaldi",
  "Vladimir Script",
  "Vrinda",
  "Westminster",
  "WHITNEY",
  "Wide Latin",
  "ZapfEllipt BT",
  "ZapfHumnst BT",
  "ZapfHumnst Dm BT",
  "Zapfino",
  "Zurich BlkEx BT",
  "Zurich Ex BT",
  "ZWAdobeF",
];

/**
 * Common fallback fonts for comparison
 */
const FALLBACK_FONTS = [
  "serif",
  "sans-serif",
  "monospace",
  "cursive",
  "fantasy",
];

/**
 * Test string for font measurement
 */
const TEST_STRING = "mmmmmmmmmliiiiiiiiilWWWWWWWWW";
const TEST_STRING_SIZE = "72px";

/**
 * Unicode test characters for different scripts
 */
const UNICODE_TESTS = {
  "Latin Extended": "\u00C0\u00C1\u00C2\u00C3",
  Cyrillic: "\u0410\u0411\u0412\u0413",
  Greek: "\u0391\u0392\u0393\u0394",
  Hebrew: "\u05D0\u05D1\u05D2\u05D3",
  Arabic: "\u0627\u0628\u062A\u062B",
  Devanagari: "\u0905\u0906\u0907\u0908",
  Chinese: "\u4E00\u4E01\u4E02\u4E03",
  "Japanese Hiragana": "\u3042\u3043\u3044\u3045",
  "Japanese Katakana": "\u30A2\u30A3\u30A4\u30A5",
  Korean: "\uAC00\uAC01\uAC02\uAC03",
  Thai: "\u0E01\u0E02\u0E03\u0E04",
  Emoji: "\uD83D\uDE00\uD83D\uDE01\uD83D\uDE02\uD83D\uDE03",
};

/**
 * Create a canvas for font measurement
 */
function createCanvas(): HTMLCanvasElement | null {
  if (!isBrowser()) return null;

  try {
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 50;
    return canvas;
  } catch {
    return null;
  }
}

/**
 * Measure text dimensions using canvas
 */
function measureTextCanvas(
  text: string,
  font: string
): { width: number; height: number } | null {
  const canvas = createCanvas();
  if (!canvas) return null;

  try {
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.font = `${TEST_STRING_SIZE} ${font}`;
    const metrics = ctx.measureText(text);

    return {
      width: metrics.width,
      height:
        (metrics.actualBoundingBoxAscent || 0) +
        (metrics.actualBoundingBoxDescent || 0),
    };
  } catch {
    return null;
  }
}

/**
 * Measure text dimensions using DOM element
 */
function measureTextDOM(
  text: string,
  font: string
): { width: number; height: number; baseline: number } | null {
  if (!isBrowser()) return null;

  try {
    const element = document.createElement("span");
    element.style.position = "absolute";
    element.style.left = "-9999px";
    element.style.top = "-9999px";
    element.style.fontSize = TEST_STRING_SIZE;
    element.style.fontFamily = font;
    element.style.margin = "0";
    element.style.padding = "0";
    element.style.border = "none";
    element.style.outline = "none";
    element.style.lineHeight = "1";
    element.textContent = text;

    document.body.appendChild(element);
    const rect = element.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(element);

    const result = {
      width: rect.width,
      height: rect.height,
      baseline: parseFloat(computedStyle.fontSize) || 0,
    };

    document.body.removeChild(element);
    return result;
  } catch {
    return null;
  }
}

/**
 * Test if a font is available
 */
function isFontAvailable(font: string): boolean {
  // Test with serif fallback
  const serifMeasurement = measureTextCanvas(TEST_STRING, `${font}, serif`);
  const defaultSerifMeasurement = measureTextCanvas(TEST_STRING, "serif");

  // Test with sans-serif fallback
  const sansSerifMeasurement = measureTextCanvas(
    TEST_STRING,
    `${font}, sans-serif`
  );
  const defaultSansSerifMeasurement = measureTextCanvas(
    TEST_STRING,
    "sans-serif"
  );

  if (
    !serifMeasurement ||
    !defaultSerifMeasurement ||
    !sansSerifMeasurement ||
    !defaultSansSerifMeasurement
  ) {
    return false;
  }

  // Font is available if measurements differ from fallbacks
  const serifDiffers =
    serifMeasurement.width !== defaultSerifMeasurement.width ||
    serifMeasurement.height !== defaultSerifMeasurement.height;

  const sansSerifDiffers =
    sansSerifMeasurement.width !== defaultSansSerifMeasurement.width ||
    sansSerifMeasurement.height !== defaultSansSerifMeasurement.height;

  return serifDiffers || sansSerifDiffers;
}

/**
 * Detect available fonts from the font list
 */
function detectAvailableFonts(): string[] {
  const availableFonts: string[] = [];

  for (const font of FONT_LIST) {
    if (isFontAvailable(font)) {
      availableFonts.push(font);
    }
  }

  return availableFonts.sort();
}

/**
 * Categorize fonts into system and web fonts
 */
function categorizeFonts(availableFonts: string[]): {
  systemFonts: string[];
  webFonts: string[];
} {
  const systemFonts: string[] = [];
  const webFonts: string[] = [];

  // Common system fonts
  const knownSystemFonts = [
    "Arial",
    "Times New Roman",
    "Helvetica",
    "Georgia",
    "Verdana",
    "Calibri",
    "Segoe UI",
    "Tahoma",
    "Impact",
    "Comic Sans MS",
    "Trebuchet MS",
    "Courier New",
    "Lucida Console",
    "Palatino",
    "Garamond",
    "Bookman",
    "Arial Black",
    "MS Sans Serif",
  ];

  for (const font of availableFonts) {
    if (knownSystemFonts.includes(font)) {
      systemFonts.push(font);
    } else {
      webFonts.push(font);
    }
  }

  return { systemFonts, webFonts };
}

/**
 * Measure font dimensions for detailed analysis
 */
function measureFontDimensions(
  fonts: string[]
): Record<string, { width: number; height: number; baseline: number }> {
  const measurements: Record<
    string,
    { width: number; height: number; baseline: number }
  > = {};

  // Limit to top 50 fonts for performance
  const fontsToMeasure = fonts.slice(0, 50);

  for (const font of fontsToMeasure) {
    const measurement = measureTextDOM(TEST_STRING, font);
    if (measurement) {
      measurements[font] = measurement;
    }
  }

  return measurements;
}

/**
 * Test Unicode character support
 */
function testUnicodeSupport(fonts: string[]): Record<string, boolean> {
  const support: Record<string, boolean> = {};

  // Test with top 20 fonts for performance
  const fontsToTest = fonts.slice(0, 20);

  for (const [scriptName, characters] of Object.entries(UNICODE_TESTS)) {
    let hasSupport = false;

    for (const font of fontsToTest) {
      const measurement = measureTextCanvas(characters, font);
      const fallbackMeasurement = measureTextCanvas(characters, "serif");

      if (
        measurement &&
        fallbackMeasurement &&
        (measurement.width !== fallbackMeasurement.width ||
          measurement.height !== fallbackMeasurement.height)
      ) {
        hasSupport = true;
        break;
      }
    }

    support[scriptName] = hasSupport;
  }

  return support;
}

/**
 * Detect fallback fonts for available fonts
 */
function detectFallbackFonts(availableFonts: string[]): Record<string, string> {
  const fallbacks: Record<string, string> = {};

  // Test top 30 fonts for performance
  const fontsToTest = availableFonts.slice(0, 30);

  for (const font of fontsToTest) {
    for (const fallback of FALLBACK_FONTS) {
      const fontMeasurement = measureTextCanvas(TEST_STRING, font);
      const fallbackMeasurement = measureTextCanvas(TEST_STRING, fallback);

      if (
        fontMeasurement &&
        fallbackMeasurement &&
        Math.abs(fontMeasurement.width - fallbackMeasurement.width) < 5 &&
        Math.abs(fontMeasurement.height - fallbackMeasurement.height) < 5
      ) {
        fallbacks[font] = fallback;
        break;
      }
    }
  }

  return fallbacks;
}

/**
 * Generate font stack variations
 */
function generateFontStacks(
  availableFonts: string[]
): Record<string, string[]> {
  const stacks: Record<string, string[]> = {};

  // Common font stack patterns
  const stackPatterns: Array<[string, string[]]> = [
    ["serif", ["Times New Roman", "Times", "Georgia", "serif"]],
    ["sans-serif", ["Arial", "Helvetica", "Verdana", "sans-serif"]],
    ["monospace", ["Courier New", "Courier", "Monaco", "monospace"]],
    ["cursive", ["Comic Sans MS", "cursive"]],
    ["fantasy", ["Impact", "fantasy"]],
  ];

  for (const [stackName, fonts] of stackPatterns) {
    const availableInStack = fonts.filter((font: string) =>
      availableFonts.includes(font)
    );
    if (availableInStack.length > 0) {
      stacks[stackName] = availableInStack;
    }
  }

  return stacks;
}

/**
 * Test font rendering characteristics
 */
function testFontRendering(fonts: string[]): Record<string, string> {
  const rendering: Record<string, string> = {};

  // Test different text samples with top 20 fonts
  const testSamples = [
    "The quick brown fox",
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    "abcdefghijklmnopqrstuvwxyz",
    "1234567890!@#$%^&*()",
    "àáâãäåæçèéêë",
  ];

  const fontsToTest = fonts.slice(0, 20);

  for (const font of fontsToTest) {
    const measurements = testSamples.map((sample) => {
      const measurement = measureTextCanvas(sample, font);
      return measurement ? `${measurement.width}x${measurement.height}` : "0x0";
    });

    rendering[font] = hashData(measurements.join("|"));
  }

  return rendering;
}

/**
 * Count detection techniques used
 */
function getDetectionTechniques(): Record<string, number> {
  return {
    canvasMeasurement: 1,
    domMeasurement: 1,
    fallbackComparison: 1,
    unicodeTesting: 1,
    fontStackAnalysis: 1,
    renderingTests: 1,
  };
}

/**
 * Main font fingerprinting function
 */
export function collectFontFingerprint(): FontFingerprint {
  if (!isBrowser()) {
    return {
      isSupported: false,
      availableFonts: [],
      systemFonts: [],
      webFonts: [],
      fontMeasurements: {},
      unicodeSupport: {},
      fallbackDetection: {},
      fontStacks: {},
      renderingTests: {},
      totalFontsDetected: 0,
      detectionTechniques: {},
      entropy: 0,
    };
  }

  return safeFeatureDetect(
    (): FontFingerprint => {
      const availableFonts = detectAvailableFonts();
      const { systemFonts, webFonts } = categorizeFonts(availableFonts);
      const fontMeasurements = measureFontDimensions(availableFonts);
      const unicodeSupport = testUnicodeSupport(availableFonts);
      const fallbackDetection = detectFallbackFonts(availableFonts);
      const fontStacks = generateFontStacks(availableFonts);
      const renderingTests = testFontRendering(availableFonts);
      const detectionTechniques = getDetectionTechniques();

      // Calculate entropy
      const combinedData = JSON.stringify({
        availableFonts,
        fontMeasurements,
        unicodeSupport,
        fallbackDetection,
        fontStacks,
        renderingTests,
      });

      const entropy = new Set(combinedData).size / combinedData.length;

      return {
        isSupported: true,
        availableFonts,
        systemFonts,
        webFonts,
        fontMeasurements,
        unicodeSupport,
        fallbackDetection,
        fontStacks,
        renderingTests,
        totalFontsDetected: availableFonts.length,
        detectionTechniques,
        entropy: Math.round(entropy * 1000) / 1000,
      };
    },
    {
      isSupported: false,
      availableFonts: [],
      systemFonts: [],
      webFonts: [],
      fontMeasurements: {},
      unicodeSupport: {},
      fallbackDetection: {},
      fontStacks: {},
      renderingTests: {},
      totalFontsDetected: 0,
      detectionTechniques: {},
      entropy: 0,
    } as FontFingerprint
  );
}
