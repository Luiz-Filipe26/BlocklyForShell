import * as Blockly from "blockly/core";

export function initSystemBlocks(): void {
  Blockly.Blocks["script_root"] = {
    init: function (this: Blockly.Block) {
      this.appendDummyInput().appendField("📜 Script Principal");
      this.appendStatementInput("STACK")
        .setCheck("command"); // Só aceita blocos do tipo "command" (nossos ls, cd, etc)

      this.setColour("#333333");
      this.setTooltip(
        "Ponto de partida do seu script. Coloque os comandos aqui dentro.",
      );
      this.setDeletable(false); // Não pode ser deletado (opcional, mas recomendado)
      this.setMovable(true);
    },
  };
}
