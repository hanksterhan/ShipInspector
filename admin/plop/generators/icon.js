export const icon = {
    description: "Automate creation of an icon",
    prompts: [
        {
            type: "input",
            name: "name",
            default: "basketball",
            message:
                "What's the name of the Icon? (e.g. basketball, football)",
        },
    ],
    actions: [
        // add icon file
        {
            type: "add",
            path: "{{>iconPath}}/{{>camelName}}.svg.ts",
            templateFile: "plop/templates/icon/icon.hbs",
        },
        //update icon index file for exports
        {
            type: "modify",
            path: "{{>iconPath}}/index.ts",
            pattern: /(\/\/ PLOP: APPEND ICON EXPORTS)/g,
            templateFile: "plop/templates/icon/index.hbs",
        },
    ],
};
