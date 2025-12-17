package br.edu.ifmg.cli.controllers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import br.edu.ifmg.cli.services.LevelService;
import io.javalin.Javalin;
import io.javalin.http.Context;

public class LevelController {

	private static final Logger logger = LoggerFactory.getLogger(LevelController.class);

	private final LevelService levelService;

	public LevelController(LevelService levelService) {
		this.levelService = levelService;
	}

	public void registerRoutes(Javalin app) {
		app.get("/api/game-data", this::getGameData);
	}

	private void getGameData(Context ctx) {
		try {
			ctx.json(levelService.getGameData());
		} catch (Exception e) {
			logger.error("Erro ao buscar dados do jogo", e);
			ctx.status(500).json("{\"error\": \"Erro interno ao carregar níveis.\"}");
		}
	}
}