import { create } from "zustand";
import { LANGUAGE_CONFIG } from "@/app/(home)/_constants";
import { Monaco } from "@monaco-editor/react";
import { CodeEditorState } from "@/types";


const getInitialState = () => {

    // if we are on the server, return the default values
    if(typeof window === "undefined"){
        return {
            language: "javascript",
            fontSize: 16,
            theme: "vs-dark",
            output: "",
            isRunning: false,
            error: null,
            editor: null,
            executionResult: null
            
        }
    }

    // if we are on the client, return the saved values (from localStorage)
    const savedLanguage = localStorage.getItem("editor-language") || "javascript";
    const savedFontSize = localStorage.getItem("editor-font-size") || "16";
    const savedTheme = localStorage.getItem("editor-theme") || "vs-dark";

    return {
        language: savedLanguage,
        theme: savedTheme,
        fontSize: Number(savedFontSize),
    }
}
export const userCodeEditorStore = create<CodeEditorState>((set, get) => {
    const initialState = getInitialState()
    return{
        ...initialState,
        output: "",
        isRunning: false,
        error: null,
        editor: null,
        executionResult: null,

        getCode: () => get().editor?.getValue() || "",

        setEditor: (editor: Monaco) => {
            const savedCode = localStorage.getItem(`editor-code-${get().language}`);
            if(savedCode) {
                editor.setValue(savedCode);
            }
            set({editor});
        },

        setTheme: (theme: string) => {
            localStorage.setItem("editor-theme", theme);
            set({theme});
        },

        setFontSize: (fontSize: number) => {
            localStorage.setItem("editor-font-size", fontSize.toString());
            set({fontSize});
        },

        setLanguage: (language: string) => {
            // Save current language code before switching
            const currentCode = get().editor?.getValue();
            if (currentCode) {
              localStorage.setItem(`editor-code-${get().language}`, currentCode);
            }
      
            localStorage.setItem("editor-language", language);
      
            set({
              language,
              output: "",
              error: null,
            });
          },

          runCode: async () => {
            const {language, getCode} = get()
            const code = getCode();

            if(!code) {
                set({error: "No code to run"})
                return;
            }
            set({isRunning: true, error: null, output: ""});

            try {
                const runtime = LANGUAGE_CONFIG[language].pistonRuntime;
                const res = await fetch("https://emkc.org/api/v2/piston/execute", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        language: runtime.language,
                        version: runtime.version,
                        files: [{content: code}],
                    }),
                })

                const data = await res.json();

                console.log("data from piston", data);

                // handle API-LEVEL errors
                if(data.message) {
                    set({error: data.message, executionResult: {code, output: "", error: data.message}});
                    return;
                }

                // handle compiler errors
                if(data.compile && data.compile.code !== 0) {
                    const err = data.compile.stderr || data.compile.stdout;
                    set({error: err, executionResult: {code, output: "", error: err}});
                    return;
                }

                //handle runtime errors
                if(data.run && data.run.code !== 0) {
                    const err = data.run.stderr || data.run.stdout;
                    set({error: err, executionResult: {code, output: "", error: err}});
                    return;
                }

                // handle success
                const output = data.run.output;
                set({ output: output.trim(), 
                    error: null, 
                    executionResult: {code, output: output.trim(), error: null}});

            }catch(error) {
                console.error("Error running code:", error);
                set({error: "Error running code", executionResult: {code, output: "", error: "Error running code"}});
            }finally {
                set({isRunning: false});
            }
          }

    }
})

export const getExecutionResult = () => userCodeEditorStore.getState().executionResult
