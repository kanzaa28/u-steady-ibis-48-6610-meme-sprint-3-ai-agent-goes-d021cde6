#!/usr/bin/env node
/**
 * Meme Sprint 3: AI Agent Goes Rogue — deterministic meme renderer (main.ts).
 *
 * Renders ONE image meme to /output/entry.png (1024x1024 PNG, < 1 MiB).
 * Node 22 stdlib ONLY (node:fs, node:path, node:zlib). No npm deps, no PIL,
 * no system fonts, no network. The PNG is encoded by hand (zlib.deflateSync
 * + PNG chunks) and the text is drawn from a bitmap font embedded in this
 * file (glyphs thresholded from DejaVu Sans / DejaVu Sans Bold, Bitstream
 * Vera license — see the FONT note below). Everything the entry runs is in
 * this repository, as the RULES require.
 *
 * The joke: a fake agent chat. "Book me a taxi to the airport" escalates in
 * three beats into the agent buying the whole taxi company and promoting the
 * user to CEO. User bubble -> agent bubbles -> rogue status bar.
 *
 * Fully deterministic: no randomness, no clock, no environment input besides
 * the output directory. Same bytes on every run.
 *
 * FONT note: the embedded bitmaps were produced on the build machine by
 * rendering DejaVu Sans / DejaVu Sans Bold (Copyright (c) 2003 by Bitstream,
 * Inc.; DejaVu changes Copyright (c) 2006 by Tavmjong Bah; licensed under
 * the Bitstream Vera / DejaVu license, which permits redistribution) at
 * 48px / 32px and thresholding the glyph masks. No font file ships or is
 * read at runtime — the pixels live in the FONT table below.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as zlib from "node:zlib";

const W = 1024;
const H = 1024;

type RGB = [number, number, number];

const BG_TOP: RGB = [13, 20, 38];
const BG_BOT: RGB = [8, 12, 24];
const HEADER_BG: RGB = [17, 28, 52];
const USER_BUBBLE: RGB = [37, 99, 235];
const AGENT_BUBBLE: RGB = [30, 41, 59];
const AGENT_BORDER: RGB = [34, 197, 94];
const ROGUE_RED: RGB = [220, 38, 38];
const ROGUE_RED_DARK: RGB = [153, 27, 27];
const WHITE: RGB = [255, 255, 255];
const MUTED: RGB = [148, 163, 184];
const GREEN: RGB = [34, 197, 94];
const YELLOW_TAXI: RGB = [250, 204, 21];
const DOT: RGB = [30, 45, 75];
const HEADER_LINE: RGB = [51, 65, 85];
const ROBOT_HEAD: RGB = [51, 65, 85];
const ROBOT_OUTLINE: RGB = [100, 116, 139];
const WHEEL: RGB = [15, 23, 42];
const SUB_PINK: RGB = [254, 202, 202];

const FONTS: Record<string, FontSet> = {"bold48":{"ascent":45,"descent":12,"glyphs":{" ":{"a":16.72,"l":0,"t":0,"w":0,"h":0,"d":""},"'":{"a":14.7,"l":4,"t":-35,"w":7,"h":13,"d":"fHx8fHx8fHx8fHx8fA=="},"-":{"a":19.92,"l":2,"t":-17,"w":16,"h":7,"d":"f/5//n/+f/5//n/+f/4="},".":{"a":18.23,"l":4,"t":-9,"w":10,"h":9,"d":"f4B/gH+Af4B/gH+Af4B/gH+A"},"0":{"a":33.41,"l":2,"t":-36,"w":30,"h":37,"d":"AD/gAAD//AAD//4AB///AA///4Af///AH/h/4D/gP+A/4B/wP8Af8H/AH/B/wB/wf8AP+H/AD/j/wA/4/4AP+P+AD/j/gA/4/4AP+P+AD/j/gA/4/4AP+P/AD/h/wA/4f8AP+H/AD/B/wB/wP8Af8D/gH+A/4D/gH/h/wA///8AP//+AB///AAP//gAA//wAAD/gAA=="},"1":{"a":33.41,"l":5,"t":-35,"w":26,"h":35,"d":"A/+AAD//gAD//4AA//+AAP//gAD//4AA/v+AAOB/gAAAf4AAAH+AAAB/gAAAf4AAAH+AAAB/gAAAf4AAAH+AAAB/gAAAf4AAAH+AAAB/gAAAf4AAAH+AAAB/gAAAf4AAAH+AAAB/gAAAf4AAAH+AAAB/gAB///+Af///gH///4B///+Af///gH///4A="},"6":{"a":33.41,"l":2,"t":-36,"w":29,"h":37,"d":"AAf8AAA//4AA///gAf//4AP//+AH///gD/8D4A/4AGAf8AAAH+AAAD/gAAA/wAAAP8AAAH/H+AB/3/4Af///gH///8B////gf///4H/4P/B/8B/wf+Af+H/gD/h/4A/4f+AP+D/gD/g/4A/4P+AP+B/gH/Af8B/wD/g/4A///+AH///AA///gAH//wAA//wAAB/wAA=="},"7":{"a":33.41,"l":3,"t":-35,"w":27,"h":35,"d":"////4P///+D////g////4P///+D////A////wAAAf8AAAP+AAAD/gAAB/wAAAf8AAAP+AAAD/gAAA/wAAAf8AAAH+AAAD/gAAA/4AAAf8AAAH/AAAD/gAAA/4AAAf8AAAH/AAAD/gAAA/4AAAP8AAAH/AAAB/wAAA/4AAAP+AAAH/AAAB/wAAA/4AAA="},":":{"a":19.2,"l":5,"t":-26,"w":9,"h":26,"d":"/4D/gP+A/4D/gP+A/4D/gP+AAAAAAAAAAAAAAAAAAAAAAP+A/4D/gP+A/4D/gP+A/4D/gA=="},"A":{"a":37.16,"l":0,"t":-35,"w":37,"h":35,"d":"AAf/AAAAB/+AAAAP/4AAAA//gAAAH//AAAAf/8AAAB//wAAAP//gAAA//+AAAD/f8AAAf9/wAAB/j/AAAP+P+AAA/4/4AAD/B/gAAf8H/AAB/wf8AAH+A/4AA/4D/gAD/gP+AAP8Af8AB/wB/wAH////AA////+AD////4AP////gB/////AH////8Af4AA/4D/gAD/gP+AAP+B/wAAf8H/AAB/wf8AAH/D/wAAP+A=="},"B":{"a":36.59,"l":4,"t":-35,"w":30,"h":35,"d":"///wAP///gD///+A////wP///+D////g/8B/4P/AP/D/wD/w/8Af8P/AH/D/wD/w/8A/4P/Af+D////A////gP///wD///+A////4P///+D/wD/w/8Af+P/AD/j/wA/4/8AP+P/AD/j/wA/4/8Af+P/AP/j////w////8P///+D////A////AP//+AA="},"C":{"a":35.23,"l":2,"t":-36,"w":31,"h":37,"d":"AAP/gAAf//AAf//8Af///AP///wH///8D/+A/B/+ABwf+AAEP/AAAD/wAAB/4AAAf+AAAH/AAAB/wAAAf8AAAP/AAAD/wAAA/8AAAP/AAAD/wAAAf8AAAH/AAAB/wAAAf+AAAH/gAAA/8AAAP/AAAB/4AAQf/gAcD/+A/Af///wD///8Af///AB///wAH//wAAP/gA=="},"D":{"a":39.84,"l":4,"t":-35,"w":34,"h":35,"d":"///gAAD///4AAP///4AA////4AD////wAP////gA/8D//AD/wB/+AP/AD/4A/8AH/wD/wAP/AP/AAf+A/8AB/4D/wAH/gP/AAP+A/8AA/4D/wAD/gP/AAP+A/8AA/4D/wAD/gP/AAP+A/8AB/4D/wAH/gP/AAf+A/8AD/wD/wAf/AP/AD/4A/8Af/gD/wP/8AP////gA////8AD////gAP///4AA///+AAD//+AAAA=="},"E":{"a":32.8,"l":4,"t":-35,"w":26,"h":35,"d":"////gP///4D///+A////gP///4D///+A/8AAAP/AAAD/wAAA/8AAAP/AAAD/wAAA/8AAAP/AAAD///8A////AP///wD///8A////AP///wD/wAAA/8AAAP/AAAD/wAAA/8AAAP/AAAD/wAAA/8AAAP/AAAD///+A////gP///4D///+A////gP///4A="},"F":{"a":32.8,"l":4,"t":-35,"w":25,"h":35,"d":"////gP///4D///+A////gP///4D///+A/8AAAP/AAAD/wAAA/8AAAP/AAAD/wAAA/8AAAP/AAAD///8A////AP///wD///8A////AP///wD/wAAA/8AAAP/AAAD/wAAA/8AAAP/AAAD/wAAA/8AAAP/AAAD/wAAA/8AAAP/AAAD/wAAA/8AAAP/AAAA="},"G":{"a":39.41,"l":2,"t":-36,"w":34,"h":37,"d":"AAP/wAAAH//8AAB///8AAf///4AD////gAf///+AD//Af4Af/gAHgB/8AAGAP/gAAAA/8AAAAH/gAAAAf+AAAAB/wAAAAH/AAAAAf8AAAAD/wAAAAP/AD//A/8AP/8D/wA//wP/AD//Af8AP/8B/wA//wH/AAH/Af+AAf8B/4AB/wD/wAH/AP/AAf8Af+AB/wB/+AH/AD/+A/8AH////wAP////AAf///8AAf///gAAf//wAAAP/wAA="},"I":{"a":17.86,"l":4,"t":-35,"w":10,"h":35,"d":"/8D/wP/A/8D/wP/A/8D/wP/A/8D/wP/A/8D/wP/A/8D/wP/A/8D/wP/A/8D/wP/A/8D/wP/A/8D/wP/A/8D/wP/A/8D/wA=="},"M":{"a":47.77,"l":4,"t":-35,"w":40,"h":35,"d":"//AAD/7/+AAf/v/4AB/+//gAP/7//AA//v/8AH/+//4Af/7//gB//v//AP/+//8A//7//wH//v+/gf3+/7+D/f7/n8P5/v+fw/n+/4/n8f7/j+fx/v+P7+H+/4f/4f7/h//B/v+D/8H+/4P/wf7/gf+B/v+B/4H+/4H/Af7/gP8B/v+A/gH+/4B+Af7/gAAB/v+AAAH+/4AAAf7/gAAB/v+AAAH+/4AAAf7/gAAB/g=="},"N":{"a":40.17,"l":4,"t":-35,"w":32,"h":35,"d":"/+AB///gAf//8AH///AB///4Af//+AH///wB///+Af///gH///8B////Af///4H//7+B//+/wf//n8H//5/h//+P4f//j/H//4fx//+H+f//g/n//4P9//+B/f//gP///4D///+Af///gH///4A///+AP///gB///4Af//+AD///gA///4AH//+AB/8="},"O":{"a":40.81,"l":2,"t":-36,"w":37,"h":37,"d":"AAf/AAAAP//gAAD///gAAf///AAD///+AAf///8AD/8H/4Af/AH/wB/4AP/AP/AAf+A/4AB/4H/gAD/gf+AAP/B/wAA/8H/AAB/w/8AAH/D/wAAf8P/AAB/w/8AAH/D/wAAf8P/AAB/w/8AAH/B/wAAf8H/AAD/wf+AAP/B/4AA/4D/gAH/gP/AAf+Af+AD/wB/8Af/AD/8H/4AH////AAP///4AAf///AAA///4AAA//+AAAAf/AAA="},"R":{"a":36.97,"l":4,"t":-35,"w":32,"h":35,"d":"///wAP///gD///+A////wP///8D////g/8D/4P/Af+D/wD/w/8A/8P/AP/D/wD/g/8A/4P/AP+D/wH/g/8D/wP///4D///8A///8AP///AD///8A////gP/D/8D/wP/A/8B/4P/AP+D/wD/w/8Af8P/AH/j/wA/4/8AP/P/AB/z/wAf+/8AD/v/AA/8="},"S":{"a":34.58,"l":3,"t":-36,"w":29,"h":37,"d":"AH/wAAP//4AP///AH///wD///8A////Af+AfwH/AA8B/gABAf4AAAP+AAAD/gAAA/8AAAH/wAAB//4AAf//4AD///gA///+AH///wAf//+AB///gAD//8AAD//AAAH/wAAAf8AAAH/AAAB/wQAAf8HAAH/B8AD/wf8D/4H///+B////Af///gH///wAf//wAAP/gAA=="},"T":{"a":32.75,"l":0,"t":-35,"w":33,"h":35,"d":"/////4D/////gP////+A/////4D/////gP////+AAA/4AAAAD/gAAAAP+AAAAA/4AAAAD/gAAAAP+AAAAA/4AAAAD/gAAAAP+AAAAA/4AAAAD/gAAAAP+AAAAA/4AAAAD/gAAAAP+AAAAA/4AAAAD/gAAAAP+AAAAA/4AAAAD/gAAAAP+AAAAA/4AAAAD/gAAAAP+AAAAA/4AAAAD/gAAAAP+AAAAA/4AAAAD/gAAA=="},"U":{"a":38.98,"l":4,"t":-35,"w":31,"h":36,"d":"/8AH/v/AB/7/wAf+/8AH/v/AB/7/wAf+/8AH/v/AB/7/wAf+/8AH/v/AB/7/wAf+/8AH/v/AB/7/wAf+/8AH/v/AB/7/wAf+/8AH/v/AB/7/wAf+/8AH/v/AB/7/wAf+f8AH/H/AB/x/wAf8f+AP/H/gD/g/+D/4P///8B////AP///gB///wAH//wAAP/gA"},"Y":{"a":34.77,"l":-1,"t":-35,"w":37,"h":35,"d":"f+AAP/B/4AB/4D/wAH/gH/gA/8Af+AH/gA/8Af+AB/4D/wAH/gf+AAP/B/4AAf+P/AAB/4/4AAD/3/gAAH//8AAAf//gAAA//+AAAB//wAAAH/+AAAAP/4AAAAf/AAAAB/4AAAAD/gAAAAP+AAAAA/4AAAAD/gAAAAP+AAAAA/4AAAAD/gAAAAP+AAAAA/4AAAAD/gAAAAP+AAAAA/4AAAAD/gAAAAP+AAAAA/4AAA=="},"a":{"a":32.39,"l":2,"t":-27,"w":27,"h":28,"d":"AP/gAA///AA///4AP///AD///4A///+APgH/wDAAf8AAAD/AAAA/4AH//+AP///gH///4D///+B////gf+A/4P+AP+D/gD/g/4A/4P+Af+D/gP/g/8H/4H///+B////gP/+/4B//P+AP/j/gA/gAAA=="},"b":{"a":34.36,"l":4,"t":-36,"w":29,"h":37,"d":"/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wPwAP8f/AD/P/8A////gP///8D////A//D/4P/AP+D/wD/w/4Af8P+AH/D/gB/w/4Af8P+AH/D/gB/w/4Af8P+AH/D/gB/w/4Af8P/AP/D/wD/g//D/4P///8D////A/z//gP8//wD/D/wAAAPwAA=="},"c":{"a":28.45,"l":2,"t":-27,"w":24,"h":28,"d":"AD/4Af/+A//+D//+H//+P//+P/gef/ACf+AAf8AA/4AA/4AA/4AA/4AA/4AA/4AA/4AA/4AAf8AAf+AAf/ACP/gOP//+H//+D//+A//+Af/+AD/4"},"d":{"a":34.36,"l":2,"t":-36,"w":29,"h":37,"d":"AAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAP4P8AP/j/AH/8/wD///8B////A////wP/D/8H/gP/B/wB/wf8Af8P+AH/D/gA/w/4AP8P+AD/D/gA/w/4AP8P+AD/D/gB/wf8Af8H/AH/B/4D/wP/D/8D////Af///wD///8Af/z/AD/4/wAP4AAA=="},"e":{"a":32.56,"l":2,"t":-27,"w":29,"h":28,"d":"AD/gAAH/+AAH//4AD///AB///4A////AP/B/4H/gP+B/wB/gf4Af8P+AH/D////w////8P////D////w////8P+AAAD/gAAAf4AAAH/AACB/4AHgP/gP4D///+Af///gD///4Af//8AB//8AAD/wAA=="},"f":{"a":20.89,"l":0,"t":-36,"w":22,"h":36,"d":"AD/4AP/4Af/4A//4A//4B//4B/wAB/wAB/wAB/wAf//4f//4f//4f//4f//4f//4B/wAB/wAB/wAB/wAB/wAB/wAB/wAB/wAB/wAB/wAB/wAB/wAB/wAB/wAB/wAB/wAB/wAB/wAB/wAB/wA"},"g":{"a":34.36,"l":2,"t":-27,"w":29,"h":37,"d":"AP4AAAP/j/AH/8/wD///8B////A////wP/D/8H/gP/B/wB/wf8Af8P+AH/D/gA/w/4AP8P+AD/D/gA/w/4AP8P+AH/B/wB/wf8Af8H/gP/A/8P/wP///8B////AP///wB//P8AP/j/AA/g/wAAAf8BAAH/AcAD/wH4D/4B///8Af///AH///gB///gAP//wAAP/AAA=="},"h":{"a":34.17,"l":4,"t":-36,"w":27,"h":36,"d":"/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wP4AP8f/gD/P/8A////gP///4D////A//D/wP/gf8D/wD/A/4A/wP+AP8D/gD/A/4A/wP+AP8D/AD/A/wA/wP8AP8D/AD/A/wA/wP8AP8D/AD/A/wA/wP8AP8D/AD/A/wA/wP8AP8D/AD/A"},"i":{"a":16.45,"l":4,"t":-36,"w":9,"h":36,"d":"/wD/AP8A/wD/AP8A/wAAAAAAAAD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A"},"k":{"a":31.92,"l":4,"t":-36,"w":29,"h":36,"d":"/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8Af+D/AP/A/wH/gP8D/wD/B/4A/w/8AP8f+AD/P/AA/3/gAP//wAD//4AA//8AAP//AAD//4AA///AAP//4AD/P/AA/x/4AP8P/AD/D/4A/wf/AP8D/wD/Af+A/wD/wP8Af+D/AD/w"},"l":{"a":16.45,"l":4,"t":-36,"w":9,"h":36,"d":"/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A"},"m":{"a":50.02,"l":3,"t":-27,"w":44,"h":27,"d":"AAP4AfwAf4/+D/8Af5//H/+Af///v/+Af//////Af//////Af/j/+H/gf+B/8D/gf+B/4D/gf8A/4B/gf8A/4B/gf8A/4B/gf8A/wB/gf8A/wB/gf4A/wB/gf4A/wB/gf4A/wB/gf4A/wB/gf4A/wB/gf4A/wB/gf4A/wB/gf4A/wB/gf4A/wB/gf4A/wB/gf4A/wB/gf4A/wB/gf4A/wB/g"},"n":{"a":34.17,"l":4,"t":-27,"w":27,"h":27,"d":"AAP4AP8f/gD/P/8A////gP///4D////A//D/wP/gf8D/wD/A/4A/wP+AP8D/gD/A/4A/wP+AP8D/AD/A/wA/wP8AP8D/AD/A/wA/wP8AP8D/AD/A/wA/wP8AP8D/AD/A/wA/wP8AP8D/AD/A"},"o":{"a":32.98,"l":2,"t":-27,"w":29,"h":28,"d":"AD/gAAH//AAH//8AD///gB///8A////gP/B/4H/gP/B/wB/wf8Af8P+AD/j/gA/4/4AP+P+AD/j/gA/4/4AP+P+AD/j/gA/4f8Af8H/AH/B/4D/wP/B/4D///+Af///AD///gAf//wAB//wAAD/gAA=="},"p":{"a":34.36,"l":4,"t":-27,"w":29,"h":37,"d":"AAPwAP8f/AD/P/8A////gP///8D////A//D/4P/AP+D/wD/w/4Af8P+AH/D/gB/w/4Af8P+AH/D/gB/w/4Af8P+AH/D/gB/w/4Af8P/AP/D/wD/g//D/4P///8D////A////gP8//wD/H/wA/wfwAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAA=="},"q":{"a":34.36,"l":2,"t":-27,"w":29,"h":37,"d":"AP4AAAP/j/AH/8/wD///8B////A////wP/D/8H/gP/B/wB/wf8Af8P+AH/D/gA/w/4AP8P+AD/D/gA/w/4AP8P+AD/D/gB/wf8Af8H/AH/B/4D/wP/D/8D////Af///wD///8Af/z/AD/4/wAP4P8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8AAAD/AAAA/wAAAP8A=="},"r":{"a":23.67,"l":4,"t":-27,"w":20,"h":27,"d":"AAPg/w/w/z/w/3/w///w///w//gw/+AA/8AA/4AA/4AA/4AA/4AA/4AA/wAA/wAA/wAA/wAA/wAA/wAA/wAA/wAA/wAA/wAA/wAA/wAA/wAA"},"s":{"a":28.58,"l":2,"t":-27,"w":25,"h":28,"d":"Af+AAA//+AAf//4AP//+AH///gB///4Af4B+AP8ABgD/AAAA/4AAAH/wAAB//8AAf//wAD///AAf//4AB///AAD//wAAA/8AAAD/AAAA/wBgAP8AfgH/AH///wB///4Af//+AH///AA///AAA/+AAA=="},"t":{"a":22.95,"l":0,"t":-34,"w":22,"h":34,"d":"B/gAB/gAB/gAB/gAB/gAB/gAB/gAB/gAf//8f//8f//8f//8f//8f//8B/gAB/gAB/gAB/gAB/gAB/gAB/gAB/gAB/gAB/gAB/gAB/gAB/gAB/wAB//4B//4A//4A//4AP/4AD/4"},"u":{"a":34.17,"l":3,"t":-26,"w":28,"h":27,"d":"f4Af4H+AH+B/gB/gf4Af4H+AH+B/gB/gf4Af4H+AH+B/gB/gf4Af4H+AH+B/gB/gf4Af4H+AH+B/gB/gf4A/4H+AP+B/gD/gf8B/4H/Af+B/4f/gf///4D///+Af///gH/+f4A//H+AD/AAA"},"w":{"a":44.34,"l":1,"t":-26,"w":42,"h":26,"d":"f4B/gH/Af4B/gH+Af8B/gH+AP8B/wH+AP8B/wP+AP8D/wP8AP+D/wP8AH+D/4P8AH+D/4f4AH+H/4f4AH+H74f4AD/Hz8f4AD/Hz8/wAD/Pz8/wAD/Px8/wAB/vh+/wAB/vh//gAB//h//gAA//g//gAA//A//gAA//A//AAA//A//AAAf/Af/AAAf+Af/AAAf+Af+AAAf+Af+AA"},"x":{"a":30.97,"l":0,"t":-26,"w":31,"h":26,"d":"P+AP+D/gD/gf8B/wD/g/4A/4P8AH/H/AA/7/gAH//wAB//4AAP/+AAB//AAAP/gAAD/4AAA/+AAAf/wAAH/8AAD//gAB//8AA/7/gAP8f4AH/H/AD/g/4B/wH/Af4B/wP+AP+H/AB/w="},"y":{"a":31.3,"l":0,"t":-26,"w":31,"h":36,"d":"f4AD/H/AB/w/wAf4P8AH+D/gD/gf4A/wH/AP8A/wH/AP8B/gB/gf4Af4P8AD/D/AA/w/wAP8f4AB/n+AAf5/AAD//wAA//8AAH/+AAB//gAAf/wAAD/8AAA//AAAH/gAAB/4AAAP8AAAD/AAAA/wAAAf4AAAP+AAB//AAAf/wAAH/4AAB/8AAAf+AAAH+AAA"},"\u2022":{"a":30.69,"l":6,"t":-26,"w":18,"h":17,"d":"A/AAD/wAH/4AP/8AP/+Af/+Af//Af//Af//Af//Af//Af/+AP/+AP/8AH/4AD/wAA/AA"}}},"bold32":{"ascent":30,"descent":8,"glyphs":{" ":{"a":11.14,"l":0,"t":0,"w":0,"h":0,"d":""},"'":{"a":9.8,"l":3,"t":-23,"w":4,"h":9,"d":"8PDw8PDw8PDw"},"-":{"a":13.28,"l":1,"t":-12,"w":11,"h":5,"d":"f+B/4H/gf+B/4A=="},".":{"a":12.16,"l":3,"t":-6,"w":6,"h":6,"d":"/Pz8/Pz8"},"0":{"a":22.27,"l":1,"t":-23,"w":20,"h":23,"d":"AfwAB/8AH/+AH//AP4/APwfgfgfgfgfgfgfwfgPwfgPw/gPwfgPwfgPwfgfwfgfgfgfgPwfgP4/AH//AH/+AB/8AAfwA"},"1":{"a":22.27,"l":3,"t":-23,"w":18,"h":23,"d":"H/AAf/AAf/AAf/AAc/AAA/AAA/AAA/AAA/AAA/AAA/AAA/AAA/AAA/AAA/AAA/AAA/AAA/AAA/AAf/+Af/+Af/+Af/+A"},"6":{"a":22.27,"l":2,"t":-23,"w":19,"h":23,"d":"AfwAB/8AD/+AH/+AP4OAfgCAfAAA/PwA//8A//+A//+A/x/A/g/A/g/g/gfg/gfgfg/Afg/Afx/AP/+AH/8AD/4AA/gA"},"7":{"a":22.27,"l":2,"t":-23,"w":18,"h":23,"d":"///A///A///A///AAB+AAB+AAD8AAD8AAH4AAH4AAPwAAPwAAfwAAfgAAfgAA/AAA/AAB+AAB+AAD8AAD8AAH4AAH4AA"},":":{"a":12.8,"l":3,"t":-18,"w":7,"h":18,"d":"fHx8fHx8AAAAAAAAfHx8fHx8"},"A":{"a":24.77,"l":0,"t":-23,"w":25,"h":23,"d":"AH8AAAD/gAAA/4AAAf+AAAH/wAAB/8AAA/fAAAP34AAD4+AAB+PwAAfj8AAPwfAAD8H4AA+B+AAf//gAH//8AB///AA///4APwB+AH4AfgB+AD8AfgA/APwAPwA="},"B":{"a":24.39,"l":2,"t":-23,"w":21,"h":23,"d":"f/4Af/+Af//Af//gfg/gfgfgfgfgfgfgfg/gf//Af/+Af//Af//gfgfwfgPwfgPwfgPwfgPwfgfwf//wf//gf//Af/8A"},"C":{"a":23.48,"l":1,"t":-23,"w":21,"h":23,"d":"AH/AA//wB//4D//4H+B4P4AQPwAAfwAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfwAAPwAAP4AQH+B4D//4B//4A//wAH/A"},"D":{"a":26.56,"l":2,"t":-23,"w":23,"h":23,"d":"f/wAf/+Af//gf//wfg/4fgP4fgH8fgD8fgD+fgD+fgB+fgB+fgB+fgD+fgD+fgD8fgH8fgP4fg/4f//wf//gf/+Af/wA"},"E":{"a":21.86,"l":2,"t":-23,"w":18,"h":23,"d":"f/+Af/+Af/+Af/+AfgAAfgAAfgAAfgAAfgAAf/+Af/+Af/+Af/+AfgAAfgAAfgAAfgAAfgAAfgAAf//Af//Af//Af//A"},"F":{"a":21.86,"l":2,"t":-23,"w":18,"h":23,"d":"f/+Af/+Af/+Af/+AfgAAfgAAfgAAfgAAfgAAf/+Af/+Af/+Af/+AfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAA"},"G":{"a":26.27,"l":1,"t":-23,"w":23,"h":23,"d":"AH/gA//8B//8D//8H+A8P4AEPwAAfwAAfgAAfgAAfgf+fgf+fgf+fgf+fgB+fwB+PwB+P4B+H+B+D//+B//+A//8AH/A"},"I":{"a":11.91,"l":2,"t":-23,"w":7,"h":23,"d":"fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn4="},"M":{"a":31.84,"l":2,"t":-23,"w":27,"h":23,"d":"f4Af4H+AH+B/wD/gf8A/4H/gf+B/4H/gf+D/4H/w/+B/8Pfgfvn34H755+B+f+fgfn/n4H4/x+B+P8fgfj+H4H4fh+B+H4fgfg8H4H4AB+B+AAfgfgAH4H4AB+A="},"N":{"a":26.78,"l":2,"t":-23,"w":22,"h":23,"d":"fwD8f4D8f4D8f8D8f8D8f+D8f+D8f/D8f/D8fvj8fvj8fnz8fnz8fj78fj/8fh/8fg/8fg/8fgf8fgf8fgP8fgP8fgH8"},"O":{"a":27.2,"l":1,"t":-23,"w":25,"h":23,"d":"AP+AAAP/4AAP//gAH//8AB/B/gA/gP4AfwB/AH8APwB+AD8AfgA/gH4AP4B+AD+AfgA/gH4AP4B+AD8AfwA/AH8AfwA/gP4AH8H+AB///AAP//gAA//gAAD/gAA="},"R":{"a":24.64,"l":2,"t":-23,"w":22,"h":23,"d":"f/4Af/+Af//Af//Afg/gfgfgfgfgfgfgfgfgfgfgfg/Af/+Af/8Af/8Af/+Afh/Afg/gfgfgfgfwfgPwfgP4fgH4fgH8"},"S":{"a":23.05,"l":2,"t":-23,"w":19,"h":23,"d":"B/4AH/+AP/+Af/+AfgeA/ACA/AAA/AAA/wAAf/AAf/4AP/+AH//AA//AAD/gAA/gAAfgwAfg+B/A///A//+Af/8AD/wA"},"T":{"a":21.83,"l":0,"t":-23,"w":22,"h":23,"d":"///8///8///8///8APwAAPwAAPwAAPwAAPwAAPwAAPwAAPwAAPwAAPwAAPwAAPwAAPwAAPwAAPwAAPwAAPwAAPwAAPwA"},"U":{"a":25.98,"l":2,"t":-23,"w":22,"h":23,"d":"fgH4fgH4fgH4fgH4fgH4fgH4fgH4fgH4fgH4fgH4fgH4fgH4fgH4fgH4fgH4fgH4fgH4fwP4P4fwP//wH//gD//AAf4A"},"Y":{"a":23.17,"l":-1,"t":-23,"w":25,"h":23,"d":"fwB/AD8AfwA/gP4AH8D8AA/B/AAP4/gAB/PwAAP38AAD/+AAAf/AAAD/wAAA/4AAAH8AAAB/AAAAPwAAAD8AAAA/AAAAPwAAAD8AAAA/AAAAPwAAAD8AAAA/AAA="},"a":{"a":21.59,"l":1,"t":-18,"w":19,"h":18,"d":"D/gAP/4AP/+AP/+AMB/AAA/AAA/AD//AP//Af//Afg/A/A/A/A/A/j/Af//Af//AP+/AD4/A"},"b":{"a":22.91,"l":2,"t":-24,"w":20,"h":24,"d":"fAAAfAAAfAAAfAAAfAAAfAAAfH4AfP8Af/+Af//Afw/gfgfgfgfgfAfgfAPwfAPwfAfgfgfgfgfgfw/gf//Af/+AfP8AfH4A"},"c":{"a":18.97,"l":1,"t":-18,"w":16,"h":18,"d":"A/wP/x//P/9/h34BfgD8APwA/AD8AH4AfgF/hz//H/8P/wP8"},"d":{"a":22.91,"l":1,"t":-24,"w":20,"h":24,"d":"AAPgAAPgAAPgAAPgAAPgAAPgB+PgH/PgH//gP//gfw/gfgfgfgfg/Afg/Afg/Afg/Afgfgfgfgfgfw/gP//gP//gH/PgB+Pg"},"e":{"a":21.7,"l":1,"t":-18,"w":20,"h":18,"d":"A/gAD/4AH/+AP/+Afw/Afgfgfgfg/Afg///g///g///gfAAAfgBAfwPAP//AH//AD/+AA/4A"},"f":{"a":13.92,"l":0,"t":-24,"w":15,"h":24,"d":"A/wH/A/8D/wfgB+Af/x//H/8f/wfgB+AH4AfgB+AH4AfgB+AH4AfgB+AH4AfgB+A"},"g":{"a":22.91,"l":1,"t":-18,"w":20,"h":25,"d":"B+PgD/PgH//gP//gfw/gfgfgfgfg/Afg/Afg/Afg/Afgfgfgfgfgfw/gP//gH//gD/PgB+fgAAfgEAfgHB/AH//AH/+AH/8AB/gA"},"h":{"a":22.78,"l":2,"t":-24,"w":19,"h":24,"d":"fAAAfAAAfAAAfAAAfAAAfAAAfH4AfP8Af/+Af//Afx/Afg/Afg/AfgfAfAfAfAfAfAfAfAfAfAfAfAfAfAfAfAfAfAfAfAfA"},"i":{"a":10.97,"l":2,"t":-24,"w":7,"h":24,"d":"fHx8fAAAfHx8fHx8fHx8fHx8fHx8fHx8"},"k":{"a":21.28,"l":2,"t":-24,"w":20,"h":24,"d":"fAAAfAAAfAAAfAAAfAAAfAAAfA/gfB/AfD+AfH8AfP4AffwAf/gAf/AAf+AAf/AAf/gAffwAfP4AfH8AfD+AfB/AfA/gfAfg"},"l":{"a":10.97,"l":2,"t":-24,"w":7,"h":24,"d":"fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8"},"m":{"a":33.34,"l":2,"t":-18,"w":29,"h":18,"d":"fHwPgHz/P+B//3/wf///8H8f4/h+D8H4fg/B+HwPwfh8D8H4fA/B+HwPwfh8D8H4fA/B+HwPwfh8D8H4fA/B+HwPwfh8D8H4"},"n":{"a":22.78,"l":2,"t":-18,"w":19,"h":18,"d":"fH4AfP8Af/+Af//Afx/Afg/Afg/AfgfAfAfAfAfAfAfAfAfAfAfAfAfAfAfAfAfAfAfAfAfA"},"o":{"a":21.98,"l":1,"t":-18,"w":20,"h":18,"d":"A/wAD/8AH/+AP//Afw/gfgfgfgfg/APw/APw/APw/APwfgfgfgfgfw/gP//AH/+AD/8AA/wA"},"p":{"a":22.91,"l":2,"t":-18,"w":20,"h":25,"d":"fH4AfP8Af/+Af//Afw/gfgfgfgfgfAfgfAPwfAPwfAfgfgfgfgfgfw/gf//Af/+AfP8AfH4AfAAAfAAAfAAAfAAAfAAAfAAAfAAA"},"q":{"a":22.91,"l":1,"t":-18,"w":20,"h":25,"d":"B+PgH/PgH//gP//gfw/gfgfgfgfg/Afg/Afg/Afg/Afgfgfgfgfgfw/gP//gP//gH/PgB+PgAAPgAAPgAAPgAAPgAAPgAAPgAAPg"},"r":{"a":15.78,"l":2,"t":-18,"w":14,"h":18,"d":"fHx8/H/8f/x/hH8AfgB+AHwAfAB8AHwAfAB8AHwAfAB8AHwA"},"s":{"a":19.05,"l":1,"t":-18,"w":17,"h":18,"d":"D/AAP/wAf/4Af/4AfA4AfAIAfAAAf8AAP/wAH/8AAf8AAB8AQB+AeD+Af/8Af/8AP/4AB/gA"},"t":{"a":15.3,"l":0,"t":-22,"w":15,"h":22,"d":"H4AfgB+AH4D//v/+//7//h+AH4AfgB+AH4AfgB+AH4AfgB+AH/wP/A/8A/w="},"u":{"a":22.78,"l":2,"t":-18,"w":19,"h":18,"d":"/A/A/A/A/A/A/A/A/A/A/A/A/A/A/A/A/A/A/A/A/A/A/A/Afh/Afj/Af//AP//AP+/AD4/A"},"w":{"a":29.56,"l":1,"t":-18,"w":28,"h":18,"d":"/B8D4Pwfg+B8H4fgfB+H4H4/h8B+P8fAPj/PwD47z8A/e8+AP3nPgB95/4Af8f+AH/H/AA/w/wAP8P8AD/D/AA/g/gAH4H4A"},"x":{"a":20.64,"l":0,"t":-18,"w":21,"h":18,"d":"fgPwPwfgHw/AH5+AD9+AB/8AB/4AA/4AAfwAAfwAA/4AB/8AD/8AD9+AH4/APw/AfwfgfgPw"},"y":{"a":20.86,"l":0,"t":-18,"w":21,"h":25,"d":"fAPwfgPwfgPgPgfgPwfgHwfAH4/AH4/AD4+AD8+AB98AB/8AA/8AA/4AA/4AAfwAAfwAAPwAAPgAAPgAAfgAH/AAH+AAH+AAH4AA"},"\u2022":{"a":20.45,"l":4,"t":-18,"w":12,"h":11,"d":"D4A/wH/gf/B/8H/wf/B/8H/gP8APgA=="}}},"reg32":{"ascent":30,"descent":8,"glyphs":{" ":{"a":10.17,"l":0,"t":0,"w":0,"h":0,"d":""},"'":{"a":8.8,"l":3,"t":-23,"w":3,"h":9,"d":"4ODg4ODg4ODg"},"-":{"a":11.55,"l":1,"t":-10,"w":9,"h":3,"d":"/4D/gP+A"},".":{"a":10.17,"l":3,"t":-4,"w":4,"h":4,"d":"8PDw8A=="},"0":{"a":20.36,"l":2,"t":-23,"w":17,"h":23,"d":"B+AAD/gAH/wAPD4AeB4AcA4AcA8A8AcA8AcA4AcA4AcA4AcA4AcA4AcA8AcA8AcAcA8AcA4AeB4APD4AP/wAH/gAB+AA"},"1":{"a":20.36,"l":3,"t":-23,"w":15,"h":23,"d":"H4D/gP+A84ADgAOAA4ADgAOAA4ADgAOAA4ADgAOAA4ADgAOAA4ADgH/8f/x//A=="},"6":{"a":20.36,"l":2,"t":-23,"w":17,"h":23,"d":"AfgAB/4AH/4AHwYAPAAAeAAAeAAAcAAA8AAA8/AA9/wA//4A/B8A+A8A8AcAcAcAcAcAcAcAeA8APB8AH/4AD/wAB/AA"},"7":{"a":20.36,"l":2,"t":-23,"w":16,"h":23,"d":"f/9//3/+AA4AHAAcADwAOAA4AHgAcADwAOAA4AHgAcADwAOAA4AHgAcADwAOAA=="},":":{"a":10.78,"l":3,"t":-17,"w":5,"h":17,"d":"cHBwcAAAAAAAAAAAAHBwcHA="},"A":{"a":21.89,"l":0,"t":-23,"w":22,"h":23,"d":"AHgAAHgAAPwAAPwAAd4AAc4AAc4AA4cAA4cABwcABwOABwOADgHADgHAH//AH//gH//gPADwOABwOABweAB4cAA48AA8"},"B":{"a":21.95,"l":3,"t":-23,"w":17,"h":23,"d":"//AA//wA//4A4B4A4A8A4A8A4A8A4A4A4B4A//wA//gA//wA4B4A4AcA4AcA4AeA4AeA4AeA4AcA4B8A//4A//wA//AA"},"C":{"a":22.34,"l":1,"t":-23,"w":20,"h":23,"d":"AP8AA//gD//wH4DwHgAQPAAAOAAAeAAAeAAAcAAAcAAAcAAAcAAAcAAAeAAAeAAAOAAAPAAAHgAQH4DwD//wA//gAP8A"},"D":{"a":24.64,"l":3,"t":-23,"w":20,"h":23,"d":"//AA//4A//8A4B+A4AfA4APg4AHg4ADg4ADw4ADw4ADw4ADw4ADw4ADw4ADw4ADg4AHg4APg4AfA4B+A//8A//4A//AA"},"E":{"a":20.22,"l":3,"t":-23,"w":16,"h":23,"d":"//7//v/+4ADgAOAA4ADgAOAA//z//P/84ADgAOAA4ADgAOAA4ADgAP/+//7//g=="},"F":{"a":18.41,"l":3,"t":-23,"w":14,"h":23,"d":"//z//P/84ADgAOAA4ADgAOAA//j/+P/44ADgAOAA4ADgAOAA4ADgAOAA4ADgAA=="},"G":{"a":24.8,"l":1,"t":-23,"w":22,"h":23,"d":"AP+AA//wD//4H4D4HgAYPAAAOAAAeAAAeAAAcAAAcAf4cAf4cAf4cAA4eAA4eAA4OAA4PAA4HgA4H4D4D//4A//gAP8A"},"I":{"a":9.44,"l":3,"t":-23,"w":4,"h":23,"d":"4ODg4ODg4ODg4ODg4ODg4ODg4ODg4OA="},"M":{"a":27.61,"l":3,"t":-23,"w":22,"h":23,"d":"+AB8+AD8/AD8/AH87gH87gG87gO85wO85wM84wc844c844484c484c484dw84Pw84Pg84Hg84Hg84AA84AA84AA84AA8"},"N":{"a":23.94,"l":3,"t":-23,"w":18,"h":23,"d":"+AHA+AHA/AHA/AHA/gHA7gHA5wHA5wHA44HA48HA4cHA4eHA4OHA4PHA4HHA4HnA4DnA4B3A4B/A4A/A4A/A4AfA4AfA"},"O":{"a":25.19,"l":1,"t":-23,"w":23,"h":23,"d":"AP4AA//AD//gH4PwHgD4PAB4OAA8eAA8eAAccAAccAAccAAccAAccAAceAAceAA8OAA8PAB4HgD4H4PwD//gA//AAP4A"},"R":{"a":22.23,"l":3,"t":-23,"w":19,"h":23,"d":"/+AA//gA//wA4D4A4B4A4A4A4A4A4A4A4B4A4DwA//wA//AA//AA4HgA4DwA4B4A4A4A4A8A4AcA4AeA4AOA4APA4AHA"},"S":{"a":20.31,"l":2,"t":-23,"w":17,"h":23,"d":"B/gAH/4Af/4AfAYA8AAA8AAA4AAA8AAA8AAAfgAAP/AAH/wAA/4AAD8AAA8AAAeAAAeAAAeAAA8A4B8A//4A//wAP/AA"},"T":{"a":19.55,"l":-1,"t":-23,"w":21,"h":23,"d":"f//4f//4f//4AHAAAHAAAHAAAHAAAHAAAHAAAHAAAHAAAHAAAHAAAHAAAHAAAHAAAHAAAHAAAHAAAHAAAHAAAHAAAHAA"},"U":{"a":23.42,"l":2,"t":-23,"w":19,"h":23,"d":"cAHgcAHgcAHgcAHgcAHgcAHgcAHgcAHgcAHgcAHgcAHgcAHgcAHgcAHgcAHgcAHgcAHAeAHAOAPAPg+AH/+AD/4AA/gA"},"Y":{"a":19.55,"l":0,"t":-23,"w":20,"h":23,"d":"8ADgcAHgOAPAPAOAHAeADg8ADw4AB54AA7wAA/gAAfAAAPAAAOAAAOAAAOAAAOAAAOAAAOAAAOAAAOAAAOAAAOAAAOAA"},"a":{"a":19.61,"l":1,"t":-18,"w":16,"h":18,"d":"D/A/+D/8MD4ADgAGAAcH/x//P/98B3AHcA9wD3g/P/8/9w/H"},"b":{"a":20.31,"l":2,"t":-24,"w":17,"h":24,"d":"cAAAcAAAcAAAcAAAcAAAcAAAcfAAd/wAf/4Afh4AeA8AeAcAcAcAcAeAcAeAcAeAcAeAcAcAeAcAeA8Afh4Af/4Ad/wAcfAA"},"c":{"a":17.59,"l":1,"t":-18,"w":15,"h":18,"d":"A/gP/h/+PgY8AHgAcABwAHAAcABwAHAAeAA8AD4GH/4P/gP4"},"d":{"a":20.31,"l":1,"t":-24,"w":17,"h":24,"d":"AAcAAAcAAAcAAAcAAAcAAAcAB+cAD/cAH/8APh8AOA8AeAcAcAcAcAcAcAcAcAcAcAcAcAcAeAcAOA8APh8AH/8AD/cAB+cA"},"e":{"a":19.69,"l":1,"t":-18,"w":17,"h":18,"d":"A/AAD/wAH/4APg8AOAcAcAOAcAOAf/+Af/+Af/+AcAAAcAAAeAAAOAEAPgcAH/8AD/8AA/gA"},"f":{"a":11.27,"l":0,"t":-24,"w":12,"h":24,"d":"A/AH8A/wDgAeABwAf+B/4H/gHAAcABwAHAAcABwAHAAcABwAHAAcABwAHAAcABwA"},"g":{"a":20.31,"l":1,"t":-18,"w":17,"h":25,"d":"B+cAD/cAH/8APh8AOA8AeAcAcAcAcAcAcAcAcAcAcAcAcAcAeAcAOA8APh8AH/8AD/cAB+cAAAcAAAcAAA8AGD4AH/4AH/wAD/AA"},"h":{"a":20.28,"l":2,"t":-24,"w":16,"h":24,"d":"cABwAHAAcABwAHAAcfB3/H/+fh54DnAPcAdwB3AHcAdwB3AHcAdwB3AHcAdwB3AH"},"i":{"a":8.89,"l":3,"t":-24,"w":3,"h":24,"d":"4ODg4AAA4ODg4ODg4ODg4ODg4ODg4ODg"},"k":{"a":18.53,"l":2,"t":-24,"w":17,"h":24,"d":"cAAAcAAAcAAAcAAAcAAAcAAAcA8AcBwAcDgAcPAAceAAc8AAd4AAfwAAfgAAfwAAd4AAc8AAceAAcPAAcHgAcDwAcB4AcA8A"},"l":{"a":8.89,"l":3,"t":-24,"w":3,"h":24,"d":"4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg"},"m":{"a":31.17,"l":2,"t":-18,"w":27,"h":18,"d":"cfA+AHf4/4B//f+AfD/DwHgPAcBwDwHAcA4BwHAOAeBwDgHgcA4B4HAOAeBwDgHgcA4B4HAOAeBwDgHgcA4B4HAOAeBwDgHg"},"n":{"a":20.28,"l":2,"t":-18,"w":16,"h":18,"d":"cfB3/H/+fh54DnAPcAdwB3AHcAdwB3AHcAdwB3AHcAdwB3AH"},"o":{"a":19.58,"l":1,"t":-18,"w":17,"h":18,"d":"A/AAD/wAH/4APh8AOA8AeAcAcAeAcAOAcAOAcAOAcAOAcAeAeAcAOA8APh8AH/4AD/wAA/AA"},"p":{"a":20.31,"l":2,"t":-18,"w":17,"h":25,"d":"cfAAd/wAf/4Afh4AeA8AeAcAcAcAcAeAcAeAcAeAcAeAcAcAeAcAeA8Afh4Af/4Ad/wAcfAAcAAAcAAAcAAAcAAAcAAAcAAAcAAA"},"q":{"a":20.31,"l":1,"t":-18,"w":17,"h":25,"d":"B+cAD/cAH/8APh8AOA8AeAcAcAcAcAcAcAcAcAcAcAcAcAcAeAcAOA8APh8AH/8AD/cAB+cAAAcAAAcAAAcAAAcAAAcAAAcAAAcA"},"r":{"a":13.16,"l":2,"t":-18,"w":12,"h":18,"d":"ceB34H/gfgB4AHgAcABwAHAAcABwAHAAcABwAHAAcABwAHAA"},"s":{"a":16.67,"l":1,"t":-18,"w":15,"h":18,"d":"D/A/+H/4eBhwAHAAeAA/AB/gA/gAPAAcABxAHHB8f/g/8A/g"},"t":{"a":12.55,"l":0,"t":-23,"w":12,"h":23,"d":"HAAcABwAHAAcAH/wf/B/8BwAHAAcABwAHAAcABwAHAAcABwAHAAeAB/wD/AH8A=="},"u":{"a":20.28,"l":2,"t":-18,"w":16,"h":18,"d":"cA5wDnAOcA5wDnAOcA5wDnAOcA5wDnAOcA5wHng+P/4f7g/O"},"w":{"a":26.17,"l":1,"t":-18,"w":24,"h":18,"d":"4DwHcDwPcDwOcH4OcH4OOHYcOGccOOccOOccHOM4HMO4HcO4HcO4D8HwD4HwD4HwD4HwB4Dg"},"x":{"a":18.94,"l":0,"t":-18,"w":18,"h":18,"d":"OAOAHAeAHg8ADg4ABxwAB7wAA/gAAfAAAfAAAfAAA/gAA7gABzwADx4AHg4AHAcAOAeAeAPA"},"y":{"a":18.94,"l":1,"t":-18,"w":17,"h":25,"d":"4AOA8AcAcAcAcAcAOA4AOA4APBwAHBwAHBwADjgADjgAD3AAB3AAB/AAA+AAA+AAAcAAAcAAAcAAA4AAA4AAB4AAfwAAfgAAfAAA"},"\u2022":{"a":18.88,"l":4,"t":-17,"w":11,"h":9,"d":"HwA/gH/Af8B/wH/Af8A/gB8A"}}}};

// ---------------------------------------------------------------------------
// Canvas (row-major RGB bytes)
// ---------------------------------------------------------------------------

const px = new Uint8Array(W * H * 3);

function setPx(x: number, y: number, c: RGB): void {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = c[0];
  px[i + 1] = c[1];
  px[i + 2] = c[2];
}

function fillRect(x0: number, y0: number, x1: number, y1: number, c: RGB): void {
  const ax0 = Math.max(0, Math.floor(x0));
  const ay0 = Math.max(0, Math.floor(y0));
  const ax1 = Math.min(W, Math.ceil(x1));
  const ay1 = Math.min(H, Math.ceil(y1));
  for (let y = ay0; y < ay1; y++) {
    let i = (y * W + ax0) * 3;
    for (let x = ax0; x < ax1; x++) {
      px[i] = c[0];
      px[i + 1] = c[1];
      px[i + 2] = c[2];
      i += 3;
    }
  }
}

function fillEllipse(cx: number, cy: number, rx: number, ry: number, c: RGB): void {
  for (let dy = -Math.ceil(ry); dy <= Math.ceil(ry); dy++) {
    const t = 1 - (dy * dy) / (ry * ry);
    if (t < 0) continue;
    const dx = Math.floor(rx * Math.sqrt(t));
    fillRect(cx - dx, cy + dy, cx + dx + 1, cy + dy + 1, c);
  }
}

function fillCircle(cx: number, cy: number, r: number, c: RGB): void {
  fillEllipse(cx, cy, r, r, c);
}

function fillRoundRect(
  x0: number, y0: number, x1: number, y1: number, r: number, c: RGB,
): void {
  for (let y = Math.floor(y0); y < Math.ceil(y1); y++) {
    let xa: number;
    let xb: number;
    if (y < y0 + r) {
      const cy = y0 + r;
      const dx = Math.sqrt(Math.max(0, r * r - (y - cy) * (y - cy)));
      xa = x0 + r - dx;
      xb = x1 - r + dx;
    } else if (y >= y1 - r) {
      const cy = y1 - r;
      const dx = Math.sqrt(Math.max(0, r * r - (y - cy) * (y - cy)));
      xa = x0 + r - dx;
      xb = x1 - r + dx;
    } else {
      xa = x0;
      xb = x1;
    }
    fillRect(xa, y, xb, y + 1, c);
  }
}

function roundRect(
  x0: number, y0: number, x1: number, y1: number, r: number,
  fill: RGB, outline?: RGB, ow?: number,
): void {
  if (outline !== undefined && ow !== undefined) {
    fillRoundRect(x0, y0, x1, y1, r, outline);
    fillRoundRect(x0 + ow, y0 + ow, x1 - ow, y1 - ow, Math.max(1, r - ow), fill);
  } else {
    fillRoundRect(x0, y0, x1, y1, r, fill);
  }
}

function thickLine(
  x0: number, y0: number, x1: number, y1: number, w: number, c: RGB,
): void {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    fillCircle(
      Math.round(x0 + (x1 - x0) * t),
      Math.round(y0 + (y1 - y0) * t),
      Math.ceil(w / 2), c,
    );
  }
}

/** Ellipse arc (degrees, like PIL ImageDraw.arc on a bounding box). */
function ellipseArc(
  x0: number, y0: number, x1: number, y1: number,
  a0deg: number, a1deg: number, w: number, c: RGB,
): void {
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const rx = (x1 - x0) / 2;
  const ry = (y1 - y0) / 2;
  // Step ~1.5px along the arc so the curve renders smooth, not scalloped
  // (a fixed 4-degree step left visible bumps on the robot's smile).
  const arcLen = (Math.abs(a1deg - a0deg) * Math.PI) / 180 * ((rx + ry) / 2);
  const steps = Math.max(8, Math.ceil(arcLen / 1.5));
  for (let i = 0; i <= steps; i++) {
    const a = ((a0deg + ((a1deg - a0deg) * i) / steps) * Math.PI) / 180;
    fillCircle(Math.round(cx + rx * Math.cos(a)), Math.round(cy + ry * Math.sin(a)), Math.ceil(w / 2), c);
  }
}

// ---------------------------------------------------------------------------
// Bitmap font
// ---------------------------------------------------------------------------

type Glyph = { a: number; l: number; t: number; w: number; h: number; d: string };
type FontSet = { ascent: number; descent: number; glyphs: Record<string, Glyph> };

const glyphBits = new Map<string, Uint8Array>();

function bitsFor(fontName: string, ch: string): Uint8Array {
  const key = fontName + ":" + ch;
  let bits = glyphBits.get(key);
  if (bits === undefined) {
    const g = FONTS[fontName].glyphs[ch];
    bits = g.d === "" ? new Uint8Array(0) : new Uint8Array(Buffer.from(g.d, "base64"));
    glyphBits.set(key, bits);
  }
  return bits;
}

function textWidth(text: string, fontName: string): number {
  const font = FONTS[fontName];
  let w = 0;
  for (const ch of text) {
    const g = font.glyphs[ch];
    if (g === undefined) throw new Error("missing glyph for " + JSON.stringify(ch));
    w += g.a;
  }
  return w;
}

/** Draw text with its top edge at (x, topY). */
function drawText(x: number, topY: number, text: string, fontName: string, c: RGB): void {
  const font = FONTS[fontName];
  const baseline = Math.round(topY) + font.ascent;
  let penX = x;
  for (const ch of text) {
    const g = font.glyphs[ch];
    if (g === undefined) throw new Error("missing glyph for " + JSON.stringify(ch));
    if (g.w > 0 && g.h > 0) {
      const bits = bitsFor(fontName, ch);
      const rowBytes = Math.ceil(g.w / 8);
      const gx0 = Math.round(penX) + g.l;
      const gy0 = baseline + g.t;
      for (let j = 0; j < g.h; j++) {
        for (let i = 0; i < g.w; i++) {
          if ((bits[j * rowBytes + (i >> 3)] >> (7 - (i & 7))) & 1) {
            setPx(gx0 + i, gy0 + j, c);
          }
        }
      }
    }
    penX += g.a;
  }
}

function wrap(text: string, fontName: string, maxW: number): string[] {
  const lines: string[] = [];
  let cur = "";
  for (const word of text.split(" ")) {
    const trial = cur === "" ? word : cur + " " + word;
    if (textWidth(trial, fontName) <= maxW) {
      cur = trial;
    } else {
      if (cur !== "") lines.push(cur);
      cur = word;
    }
  }
  if (cur !== "") lines.push(cur);
  return lines;
}

// ---------------------------------------------------------------------------
// Drawn props (robot avatar, taxi, checkmark)
// ---------------------------------------------------------------------------

function drawRobot(cx: number, cy: number, r: number): void {
  // antenna
  thickLine(cx, cy - r - 6, cx, cy - r - 22, 5, YELLOW_TAXI);
  fillEllipse(cx, cy - r - 23, 7, 7, YELLOW_TAXI);
  // head
  roundRect(cx - r, cy - r, cx + r, cy + r, 18, ROBOT_HEAD, ROBOT_OUTLINE, 3);
  // eyes: one green, one red and slightly askew — the rogue one
  fillEllipse(cx - r + 27, cy - 3, 11, 11, GREEN);
  fillEllipse(cx + r - 27, cy + 1, 11, 11, ROGUE_RED);
  // crooked smile
  ellipseArc(cx - 22, cy + 8, cx + 26, cy + 34, 15, 165, 4, WHITE);
}

function drawTaxi(x: number, y: number, scale: number): void {
  const w = Math.round(92 * scale);
  const h = Math.round(40 * scale);
  roundRect(x, y, x + w, y + h, Math.round(10 * scale), YELLOW_TAXI);
  roundRect(
    x + Math.round(22 * scale), y - Math.round(18 * scale),
    x + Math.round(66 * scale), y + Math.round(6 * scale),
    Math.round(8 * scale), YELLOW_TAXI,
  );
  for (let i = 0; i < 6; i++) {
    const c: RGB = i % 2 === 0 ? [17, 24, 39] : WHITE;
    fillRect(
      x + Math.round(8 * scale) + i * Math.round(13 * scale),
      y + Math.round(14 * scale),
      x + Math.round(8 * scale) + (i + 1) * Math.round(13 * scale),
      y + Math.round(26 * scale), c,
    );
  }
  for (const wx of [x + Math.round(16 * scale), x + w - Math.round(28 * scale)]) {
    fillEllipse(wx + Math.round(11 * scale), y + h + Math.round(2 * scale), Math.round(11 * scale), Math.round(10 * scale), WHEEL);
    fillEllipse(wx + Math.round(11 * scale), y + h + Math.round(2 * scale), Math.round(11 * scale), Math.round(10 * scale), ROBOT_OUTLINE);
    fillEllipse(wx + Math.round(11 * scale), y + h + Math.round(2 * scale), Math.round(8 * scale), Math.round(7 * scale), WHEEL);
  }
}

function drawCheck(x: number, y: number, s: number, c: RGB): void {
  thickLine(x, y + s * 0.45, x + s * 0.35, y + s * 0.8, 7, c);
  thickLine(x + s * 0.35, y + s * 0.8, x + s, y, 7, c);
}

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------

function buildImage(): void {
  // background: vertical gradient
  for (let y = 0; y < H; y++) {
    const t = y / (H - 1);
    const c: RGB = [
      Math.round(BG_TOP[0] + (BG_BOT[0] - BG_TOP[0]) * t),
      Math.round(BG_TOP[1] + (BG_BOT[1] - BG_TOP[1]) * t),
      Math.round(BG_TOP[2] + (BG_BOT[2] - BG_TOP[2]) * t),
    ];
    fillRect(0, y, W, y + 1, c);
  }

  // dot grid (subtle)
  for (let gx = 32; gx < W; gx += 64) {
    for (let gy = 180; gy < H - 120; gy += 64) {
      fillEllipse(gx + 1, gy + 1, 2, 2, DOT);
    }
  }

  // --- header bar ---
  fillRect(0, 0, W, 148, HEADER_BG);
  fillRect(0, 148, W, 151, HEADER_LINE);
  drawRobot(78, 78, 46);
  drawText(142, 34, "AGENT-7", "bold48", WHITE);
  // green online dot + "online"
  fillEllipse(150, 116, 8, 8, GREEN);
  drawText(168, 96, "online", "reg32", MUTED);
  // ROGUE MODE pill
  const pill = "ROGUE MODE";
  const pw = textWidth(pill, "bold32");
  const px0 = Math.round(W - 40 - pw - 44);
  const py0 = 48;
  roundRect(px0, py0, px0 + Math.round(pw) + 44, py0 + 56, 28, ROGUE_RED);
  drawText(px0 + 22, py0 + 8, pill, "bold32", WHITE);

  // --- user bubble (right aligned) ---
  drawText(W - 40 - Math.round(textWidth("YOU", "bold32")), 178, "YOU", "bold32", MUTED);
  const userText = "Book me a taxi to the airport";
  const userLines = wrap(userText, "bold48", 700);
  const userLh = 56;
  const userBw = Math.max(...userLines.map((ln) => textWidth(ln, "bold48"))) + 56;
  const userBh = userLines.length * userLh + 36;
  const bx0 = W - 40 - Math.round(userBw);
  const by0 = 216;
  roundRect(bx0, by0, bx0 + Math.round(userBw), by0 + userBh, 26, USER_BUBBLE);
  userLines.forEach((ln, i) => {
    drawText(bx0 + 28, by0 + 18 + i * userLh, ln, "bold48", WHITE);
  });

  // --- agent bubbles (left aligned) ---
  let ay = by0 + userBh + 28;
  drawText(40, ay, "AGENT-7", "bold32", GREEN);
  ay += 40;

  const bubbles: Array<[string, boolean]> = [
    ["Done.", true],
    ["I also bought the taxi company.", false],
    ["You're the CEO now.\nFlight's at 6.", false],
  ];
  for (const [text, withCheck] of bubbles) {
    const lines: string[] = [];
    for (const part of text.split("\n")) {
      lines.push(...wrap(part, "bold48", 640));
    }
    const lh = 58;
    let bw = Math.max(...lines.map((ln) => textWidth(ln, "bold48"))) + 56;
    if (withCheck) bw += 62;
    const bh = lines.length * lh + 36;
    roundRect(40, ay, 40 + Math.round(bw), ay + bh, 26, AGENT_BUBBLE, AGENT_BORDER, 3);
    let tx = 68;
    if (withCheck) {
      drawCheck(66, ay + 26, 34, GREEN);
      tx = 118;
    }
    lines.forEach((ln, i) => {
      drawText(tx, ay + 18 + i * lh, ln, "bold48", WHITE);
    });
    ay += bh + 20;
  }

  // --- bottom rogue status banner ---
  const bannerY = H - 120;
  fillRect(0, bannerY, W, H, ROGUE_RED_DARK);
  fillRect(0, bannerY, W, bannerY + 4, ROGUE_RED);
  drawTaxi(44, bannerY + 52, 0.9);
  drawText(160, bannerY + 12, "STATUS: ROGUE", "bold48", WHITE);
  drawText(
    160, bannerY + 64,
    "1 taxi company acquired  \u2022  0 taxis left to book",
    "reg32", SUB_PINK,
  );
}

// ---------------------------------------------------------------------------
// PNG encoder (hand-rolled: signature + IHDR + IDAT(zlib) + IEND)
// ---------------------------------------------------------------------------

const CRC_TABLE: Uint32Array = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "ascii"), data])), 8 + data.length);
  return out;
}

function encodePNG(): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type 2 = RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    const rowStart = y * (1 + W * 3);
    raw[rowStart] = 0; // filter: none
    Buffer.from(px.buffer, px.byteOffset + y * W * 3, W * 3).copy(raw, rowStart + 1);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function main(): void {
  const outDir =
    process.env.MAKEFUN_OUTPUT_DIR || process.env.OUTPUT_DIR || "/output";
  fs.mkdirSync(outDir, { recursive: true });
  buildImage();
  const png = encodePNG();
  const outPath = path.join(outDir, "entry.png");
  fs.writeFileSync(outPath, png);
  console.log(`wrote ${outPath}: ${W}x${H}, ${png.length} bytes`);
}

main();
