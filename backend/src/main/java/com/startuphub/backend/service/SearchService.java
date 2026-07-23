package com.startuphub.backend.service;

import com.startuphub.backend.dto.response.GlobalSearchResult;
import com.startuphub.backend.entity.Startup;
import com.startuphub.backend.entity.User;
import com.startuphub.backend.repository.StartupRepository;
import com.startuphub.backend.repository.UserRepository;
import com.startuphub.backend.entity.enums.StartupStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SearchService {

    private final StartupRepository startupRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<GlobalSearchResult> globalSearch(String query) {
        List<GlobalSearchResult> results = new ArrayList<>();
        
        if (query == null || query.trim().length() < 2) {
            return results;
        }

        // Search Startups
        List<Startup> startups = startupRepository.searchActiveStartups(query, StartupStatus.PUBLISHED);
        for (Startup startup : startups) {
            results.add(GlobalSearchResult.builder()
                    .id(startup.getUuid().toString())
                    .type("STARTUP")
                    .title(startup.getName())
                    .subtitle(startup.getTagline())
                    .url("/startups/" + startup.getUuid())
                    .build());
        }

        // Search Users
        List<User> users = userRepository.findByFullNameContainingIgnoreCaseOrUsernameContainingIgnoreCase(query, query);
        for (User user : users) {
            results.add(GlobalSearchResult.builder()
                    .id(user.getUuid().toString())
                    .type("USER")
                    .title(user.getFullName())
                    .subtitle(user.getRole().name())
                    .url("/profile/" + user.getUuid())
                    .build());
        }

        return results;
    }
}
