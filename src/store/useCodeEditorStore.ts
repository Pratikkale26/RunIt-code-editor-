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
            // Todo
          }

    }
})