package br.edu.ifmg.cli.services;

import br.edu.ifmg.cli.models.Level;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

public class LevelService {
    
    private final Map<String, Level> levelsMap;
    private final List<Level> levelsList; // Mantém a ordem do JSON

    public LevelService() {
        try (var stream = getClass().getResourceAsStream("/levels.json")) {
            if (stream == null) throw new RuntimeException("levels.json não encontrado!");
            
            var reader = new InputStreamReader(stream, StandardCharsets.UTF_8);
            var listType = new TypeToken<List<Level>>(){}.getType();
            
            List<Level> loadedLevels = new Gson().fromJson(reader, listType);
            this.levelsList = List.copyOf(loadedLevels);
            
            this.levelsMap = levelsList.stream()
                .collect(Collectors.toUnmodifiableMap(Level::id, Function.identity()));
                
        } catch (Exception e) {
            throw new RuntimeException("Falha ao carregar níveis", e);
        }
    }

    public List<Level> getAllLevels() {
        return levelsList;
    }

    public Optional<Level> getLevel(String id) {
        return Optional.ofNullable(levelsMap.get(id));
    }
}