# What we found in /Users/audax/Development/AI/montrix-vice-snapshot-20261115103455.vsf

montrix-vice-snapshot-20261115103455.vsf isn't a format we recognise yet.

Evidence ev_b9e02d5bbabffa687e77de3b5166fab191b43f70a3357602de6b42da0169b2e2.

```json
{
  "description": "A file we don't recognise yet",
  "kind": "unknown",
  "next_steps": [
    {
      "tool": "native_bytes_show",
      "why": "look at the raw bytes"
    },
    {
      "tool": "core_target_open",
      "why": "reopen with format=raw-binary if it is machine code"
    }
  ],
  "plain_english": "montrix-vice-snapshot-20261115103455.vsf isn't a format we recognise yet.",
  "recommended_toolsets": [
    "core"
  ],
  "size": 193261
}
```

## Ghidra

Ghidra couldn't analyse /Users/audax/Development/AI/montrix-vice-snapshot-20261115103455.vsf (could not start Ghidra: this Ghidra has no decompiler program for this computer, which its public downloads leave out on macOS. Build it once by running `./gradlew buildNatives` in /Users/audax/Library/Application Support/craft-anything/engines/ghidra/ghidra_12.1.4_PUBLIC/support/gradle), so decompiling uses the built-in decompiler.

## The game's own files

Folder: /Users/audax/Development/AI

- Maps and levels: 5728 files, 81.4 MB. For example:
  - games/three-js-smaland-racer/node_modules/.vite/deps/three.js.map
  - games/three-js-smaland-racer/node_modules/@dimforge/rapier3d-compat/rapier.es.js.map
  - agents-poc/node_modules/axios/dist/axios.min.js.map
  - agents-poc/node_modules/axios/dist/node/axios.cjs.map
  - agents-poc/node_modules/axios/dist/browser/axios.cjs.map
  - agents-poc/node_modules/axios/dist/esm/axios.min.js.map
  - agents-poc/node_modules/@jridgewell/resolve-uri/dist/resolve-uri.umd.js.map
  - agents-poc/node_modules/@jridgewell/trace-mapping/dist/trace-mapping.mjs.map
- Textures and pictures: 185 files, 65.1 MB. For example:
  - opencode/packages/console/app/public/web-app-manifest-192x192.png
  - opencode/packages/console/app/public/email/zen-logo.png
  - opencode/packages/opencode/test/tool/fixtures/large-image.png
  - opencode/packages/docs/images/hero-light.png
  - opencode/packages/desktop/src-tauri/assets/nsis-sidebar.bmp
  - opencode/packages/desktop/src-tauri/icons/dev/icon.png
  - opencode/packages/desktop/src-tauri/icons/prod/icon.png
  - opencode/packages/web/src/assets/web/web-homepage-new-session.png
- Sounds and music: 12 files, 1.4 MB. For example:
  - existing/kilocode/webview-ui/audio/notification.wav
  - ai/packages/openai/src/transcription/transcription-test.mp3
  - ai/packages/revai/src/transcript-test.mp3
  - ai/packages/assemblyai/src/transcript-test.mp3
  - ai/packages/elevenlabs/src/transcript-test.mp3
  - ai/packages/groq/src/transcript-test.mp3
  - ai/packages/deepgram/src/transcript-test.mp3
  - ai/packages/fal/src/transcript-test.mp3
- Settings and scripts: 2929 files, 34.2 MB. For example:
  - package.json
  - remodel-c4/output.yaml
  - remodel-c4/.venv/pyvenv.cfg
  - remodel-c4/.venv/lib/python3.13/site-packages/pyyaml-6.0.3.dist-info/top_level.txt
  - remodel-c4/.venv/lib/python3.13/site-packages/pip-25.0.dist-info/entry_points.txt
  - remodel-c4/.venv/lib/python3.13/site-packages/ruamel_yaml-0.19.1.dist-info/top_level.txt
  - opencode/turbo.json
  - opencode/themes/deltarune.json
- Read-me and licence files: 2698 files, 15.7 MB. For example:
  - remodel-c4/.venv/lib/python3.13/site-packages/pip-25.0.dist-info/LICENSE.txt
  - remodel-c4/layout/_INSTRUCTION.md
  - opencode/STATS.md
  - opencode/.github/pull_request_template.md
  - opencode/packages/console/app/README.md
  - opencode/packages/console/app/.opencode/agent/css.md
  - opencode/packages/opencode/README.md
  - opencode/packages/opencode/src/acp/README.md

## JavaScript application

Web app AI 1.0.0: 1590 source files, 0 IPC channel(s) (0 paired), 0 window(s), 165 endpoint(s), 20 route(s), bundled with browserify/vite.

Evidence ev_bdddc7524470d7074363d3cd7ef634df52ac9c79d0a365bfaee41b2b271451ee.

```json
{
  "api_operations": [
    {
      "confidence": "inferred",
      "function": "fetchIssue",
      "kind": "query",
      "line": 839,
      "literal": true,
      "module": "opencode/github/index.ts",
      "name": null,
      "protocol": "graphql",
      "role": "unknown",
      "source": "document-text",
      "url": null
    },
    {
      "confidence": "inferred",
      "function": "fetchPR",
      "kind": "query",
      "line": 904,
      "literal": true,
      "module": "opencode/github/index.ts",
      "name": null,
      "protocol": "graphql",
      "role": "unknown",
      "source": "document-text",
      "url": null
    },
    {
      "confidence": "inferred",
      "function": "fetchIssue",
      "kind": "query",
      "line": 1320,
      "literal": true,
      "module": "opencode/packages/opencode/src/cli/cmd/github.ts",
      "name": null,
      "protocol": "graphql",
      "role": "unknown",
      "source": "document-text",
      "url": null
    },
    {
      "confidence": "inferred",
      "function": "fetchPR",
      "kind": "query",
      "line": 1391,
      "literal": true,
      "module": "opencode/packages/opencode/src/cli/cmd/github.ts",
      "name": null,
      "protocol": "graphql",
      "role": "unknown",
      "source": "document-text",
      "url": null
    }
  ],
  "app_kind": "web",
  "bundlers": [
    "browserify",
    "vite"
  ],
  "edges": [
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#1",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#<anonymous@376>@376"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#1",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#N@18"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#1",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#h@50"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#1",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#this.worker.onmessage@376"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#1",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#value@72"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#1",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#w@50"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$$@376"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$0@376"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$0n@380"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$0t@381"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$1@49"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$1n@380"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$1t@380"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$2e@377"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$2n@380"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$3@49"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$3e@377"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$3n@380"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$4@49"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$5@380"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$6@49"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$8@376"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$9@380"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$@18"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$A@50"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$B@49"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$D@380"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$E@376"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$Ee@380"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$En@381"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$F@49"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$Ge@376"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$H@376"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$He@376"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$J@50"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$Je@376"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$Jt@376"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$K@380"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$Ke@376"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$L@376"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$O@49"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$Qe@376"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$Qt@376"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$R@49"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$S@378"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$Sn@381"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$U@377"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$Ue@376"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$Ve@376"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$We@376"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$Wt@376"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$Xe@376"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$Xt@376"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$Ye@376"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$Yt@376"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$Z@49"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$Ze@376"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$Zt@376"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$_@376"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$ae@380"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$an@376"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$at@376"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$be@376"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$bn@380"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$cn@377"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$ct@377"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$dn@378"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$dt@380"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$e@376"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$ee@376"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$en@376"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$et@376"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$f@376"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$fn@377"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$ft@380"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$g@376"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$gn@380"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$gt@380"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$hn@378"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$ht@380"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$i@377"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$ie@378"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$in@376"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$it@376"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$j@49"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$ke@380"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$kn@381"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$l@376"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$ln@377"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$lt@378"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$m@376"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$me@376"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$mn@380"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$n@376"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$ne@376"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$nn@376"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$nt@376"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$o@49"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$on@376"
    },
    {
      "from": "bundle-module:ocif-generator/dist/assets/index-DzptfolP.js#2",
      "kind": "defines",
      "to": "fn:ocif-generator/dist/assets/index-DzptfolP.js#$ot@377"
    },
    {
      "from": "bundle
```
