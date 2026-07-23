package com.startuphub.backend.controller;

import com.startuphub.backend.dto.ApiResponse;
import com.startuphub.backend.dto.response.GlobalSearchResult;
import com.startuphub.backend.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<GlobalSearchResult>>> search(@RequestParam String q) {
        return ResponseEntity.ok(ApiResponse.success(
                searchService.globalSearch(q),
                "Search completed"
        ));
    }
}
