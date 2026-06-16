package io.recruittrack.backend.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HiringFunnelResponse {
    private String stageName;
    private long count;
    private double conversionPercentage;
    private double dropOffPercentage;
}
