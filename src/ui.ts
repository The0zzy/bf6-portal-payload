let friendlycolour = mod.CreateVector(0, 0.8, 1);
let enemycolour = mod.CreateVector(1, 0.2, 0.2);
let friendlybgcolour = mod.CreateVector(0, 0.2, 0.5);
let enemybgcolour = mod.CreateVector(0.6, 0.1, 0.1);




export function uiSetup(): void {
    mod.AddUIContainer("container", mod.CreateVector(0, 50, 0), mod.CreateVector(2000, 2000, 0), mod.UIAnchor.Center);

    // Retrieve the container widget
    const containerWidget = mod.FindUIWidgetWithName("container");
    //mod.SetUIWidgetBgFill(containerWidget, mod.UIBgFill.None);
    mod.SetUIWidgetDepth(containerWidget, mod.UIDepth.AboveGameUI);

    if (containerWidget) {
        // Add PayloadStatusText
        // 50 down (Y=50), 85 wide, 30 tall
        mod.AddUIText(
            "PayloadStatusText",
            mod.CreateVector(0, 0, 0),
            mod.CreateVector(85, 30, 0),
            mod.UIAnchor.TopCenter,
            containerWidget,
            true, // visible
            0, // padding
            mod.CreateVector(0, 0, 0), // bgColor
            0.8, // bgAlpha
            mod.UIBgFill.Blur, // bgFill
            mod.Message(mod.stringkeys.payload.state.message, mod.stringkeys.payload.state.idle),
            20, // textSize
            mod.CreateVector(1, 1, 1), // textColor
            1, // textAlpha
            mod.UIAnchor.Center
        );
    }
}
