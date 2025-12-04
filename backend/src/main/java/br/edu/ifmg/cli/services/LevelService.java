package br.edu.ifmg.cli.services;

import br.edu.ifmg.cli.models.GameData;
import br.edu.ifmg.cli.models.Level;
import com.google.gson.Gson;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

public class LevelService {
    
    private final GameData gameData;
    private final Map<String, Level> levelsMap;

    public LevelService() {
        try (var stream = getClass().getResourceAsStream("/levels.json")) {
            if (stream == null) throw new RuntimeException("levels.json não encontrado!");
            
            var reader = new InputStreamReader(stream, StandardCharsets.UTF_8);
            
            this.gameData = new Gson().fromJson(reader, GameData.class);
            
            this.levelsMap = gameData.levels().stream()
                .collect(Collectors.toUnmodifiableMap(Level::id, Function.identity()));
                
        } catch (Exception e) {
            throw new RuntimeException("Falha ao carregar níveis", e);
        }
    }

    public GameData getGameData() {
        return gameData;
    }

    public Optional<Level> getLevel(String id) {
        return Optional.ofNullable(levelsMap.get(id));
    }
}