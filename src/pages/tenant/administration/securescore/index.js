import { TabbedLayout } from "/src/layouts/TabbedLayout";
import { Layout as DashboardLayout } from "/src/layouts/index.js";
import tabOptions from "./tabOptions";
import { useSecureScore } from "../../../../hooks/use-securescore";
import { CippInfoBar } from "../../../../components/CippCards/CippInfoBar";
import { Box, Button, Chip, Container, Typography } from "@mui/material";
import { Grid } from "@mui/system";
import { CheckCircleIcon, GlobeAltIcon } from "@heroicons/react/24/outline";
import { Map, Score } from "@mui/icons-material";
import { CippChartCard } from "../../../../components/CippCards/CippChartCard";
import TimeAgo from "javascript-time-ago";
import CippButtonCard from "../../../../components/CippCards/CippButtonCard";
import DOMPurify from "dompurify";
import { CippApiDialog } from "../../../../components/CippComponents/CippApiDialog";
import { useDialog } from "../../../../hooks/use-dialog";
import { useState } from "react";
import { CippTableDialog } from "../../../../components/CippComponents/CippTableDialog";
import { CippImageCard } from "../../../../components/CippCards/CippImageCard";
import { useSettings } from "../../../../hooks/use-settings";
import { useRouter } from "next/navigation";

const Page = () => {
  const currentTenant = useSettings().currentTenant;
  const createDialog = useDialog();
  const secureScore = useSecureScore();
  const [actionData, setActionData] = useState({ data: {}, action: {}, ready: false });
  const [updatesData, setUpdatesData] = useState({ data: {}, ready: false });
  const cippTableDialog = useDialog();
  const router = useRouter();
  const timeAgo = new TimeAgo("en-US");

  const openRemediation = (url) => {
    if (url.startsWith("https")) {
      window.open(url, "_blank");
    } else {
      router.push(url);
    }
  };
  return (
    <Container
      sx={{
        flexGrow: 1,
        py: 2,
      }}
      maxWidth={false}
    >
      <Grid container spacing={2}>
        {currentTenant === "AllTenants" && (
          <Grid size={{ md: 4, xs: 12 }}>
            <CippImageCard
              title="Not supported"
              imageUrl="/assets/illustrations/undraw_website_ij0l.svg"
              text={
                "The Tenant Overview does not support all Tenants, please select a different tenant using the tenant selector. Would you like to see the scores for all tenants? Check out the Best Practices report instead."
              }
            />
          </Grid>
        )}
        {currentTenant !== "AllTenants" && (
          <>
            <Grid size={{ md: 12, xs: 12 }}>
              <CippInfoBar
                isFetching={secureScore.isFetching}
                data={[
                  {
                    icon: <CheckCircleIcon />,
                    data: secureScore.translatedData.percentageCurrent + "%",
                    name: "Current Score",
                    color: "secondary",
                  },
                  {
                    icon: <GlobeAltIcon />,
                    data: secureScore.translatedData.percentageVsAllTenants + "%",
                    name: "Compared score (All Tenants)",
                    color: "green",
                  },
                  {
                    icon: <Map />,
                    data: secureScore.translatedData.percentageVsSimilar + "%",
                    name: "Compared score (Similar Tenants)",
                  },
                  {
                    icon: <Score />,
                    data: `${secureScore.translatedData.currentScore} of ${secureScore.translatedData.maxScore}`,
                    name: "Score in points",
                  },
                ]}
              />
            </Grid>
            <Grid size={{ md: 3, xs: 12 }}>
              <CippChartCard
                isFetching={secureScore.isFetching}
                title={"Secure Score"}
                chartSeries={
                  secureScore.secureScore.isSuccess
                    ? [
                        {
                          name: "Secure Score",
                          data: secureScore.secureScore.data.Results.map((data) => ({
                            x: timeAgo.format(new Date(data.createdDateTime)),
                            y: data.currentScore,
                          })).reverse(),
                        },
                      ]
                    : []
                }
                chartType="area"
              />
            </Grid>

            {currentTenant !== "AllTenants" &&
              secureScore.isSuccess &&
              secureScore.translatedData.controlScores.map((secureScoreControl) => (
                <Grid size={{ md: 3, xs: 12 }} key={secureScoreControl.controlName}>
                  <CippButtonCard
                    title={secureScoreControl.title}
                    isFetching={secureScore.isFetching}
                    cardSx={{ display: "flex", flexDirection: "column", height: "100%" }}
                    CardButton={
                      <>
                        <Button
                          size="small"
                          onClick={() => {
                            setActionData({
                              data: secureScoreControl,
                              ready: true,
                            });
                            createDialog.handleOpen();
                          }}
                          variant="contained"
                        >
                          Change Status
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => openRemediation(secureScoreControl.actionUrl)}
                        >
                          Remediate
                        </Button>
                        {secureScoreControl.controlStateUpdates?.length > 0 && (
                          <Button
                            size="small"
                            onClick={() => {
                              setUpdatesData({
                                data: secureScoreControl,
                                ready: true,
                              });
                              cippTableDialog.handleOpen();
                            }}
                            variant="outlined"
                          >
                            Updates {`(${secureScoreControl.controlStateUpdates?.length})`}
                          </Button>
                        )}
                      </>
                    }
                  >
                    <Box sx={{ flexGrow: 1 }}>
                      <Chip
                        variant="outlined"
                        label={`${secureScoreControl.scoreInPercentage}% ${
                          secureScoreControl.controlStateUpdates?.[0]?.state === "ThirdParty"
                            ? "- Resolved by Third Party"
                            : ""
                        }`}
                        size="small"
                        color={
                          secureScoreControl.scoreInPercentage === 100
                            ? "success"
                            : secureScoreControl.scoreInPercentage > 50
                            ? "warning"
                            : "error"
                        }
                      />

                      {secureScoreControl.description && (
                        <>
                          <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 2 }}>
                            Description
                          </Typography>
                          <Typography
                            variant="body2"
                            color="textPrimary"
                            sx={{
                              "& a": {
                                color: (theme) => theme.palette.primary.main,
                                textDecoration: "underline",
                              },
                            }}
                            dangerouslySetInnerHTML={{
                              __html: DOMPurify.sanitize(secureScoreControl.description),
                            }}
                          />
                        </>
                      )}

                      {secureScoreControl.remediation &&
                        secureScoreControl.scoreInPercentage !== 100 && (
                          <>
                            <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 2 }}>
                              Remediation Recommendation
                            </Typography>
                            <Typography
                              variant="body2"
                              color="textPrimary"
                              sx={{
                                "& a": {
                                  color: (theme) => theme.palette.primary.main,
                                  textDecoration: "underline",
                                },
                              }}
                              dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(secureScoreControl.remediation),
                              }}
                            />
                          </>
                        )}

                      {secureScoreControl.threats?.length > 0 && (
                        <>
                          <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 2 }}>
                            Threats
                          </Typography>
                          <Box sx={{ display: "flex", flexWrap: "wrap", mt: 1 }}>
                            {secureScoreControl.threats.map((threat, idx) => (
                              <Chip
                                key={idx}
                                label={threat}
                                size="small"
                                color="info"
                                sx={{ mr: 1, mt: 1 }}
                              />
                            ))}
                          </Box>
                        </>
                      )}

                      {secureScoreControl.complianceInformation?.length > 0 && (
                        <>
                          <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 2 }}>
                            Compliance Frameworks
                          </Typography>
                          <Box sx={{ display: "flex", flexWrap: "wrap", mt: 1 }}>
                            {secureScoreControl.complianceInformation.map((framework, idx) => (
                              <Chip
                                key={idx}
                                label={`${framework.certificationName} - ${framework.certificationControls[0]?.name}`}
                                size="small"
                                color="info"
                                sx={{ mr: 1, mt: 1 }}
                              />
                            ))}
                          </Box>
                        </>
                      )}
                    </Box>
                  </CippButtonCard>
                </Grid>
              ))}
            {updatesData.ready && (
              <CippTableDialog
                createDialog={cippTableDialog}
                title={`Updates for ${updatesData.data.title}`}
                data={updatesData.data.controlStateUpdates}
                simpleColumns={["state", "assignedTo", "comment", "updatedBy", "updatedDateTime"]}
              />
            )}
            <CippApiDialog
              createDialog={createDialog}
              title="Confirmation"
              fields={[
                {
                  type: "autoComplete",
                  name: "resolutionType",
                  options: [
                    {
                      value: "ThirdParty",
                      label: "Resolved by Third Party (Mark as completed, receive points)",
                    },
                    {
                      value: "Ignored",
                      label: "Ignored / Risk Accepted (Mark as completed, do not receive points)",
                    },
                    {
                      value: "Default",
                      label: "Mark as default (Receive points if Microsoft detects as completed)",
                    },
                  ],
                  label: "Resolution Type",
                },
                {
                  type: "textField",
                  name: "reason",
                  label: "Reason for change (Mandatory)",
                },
              ]}
              api={{
                url: "/api/ExecUpdateSecureScore",
                type: "POST",
                data: {
                  controlName: "controlName",
                  vendorInformation: "vendorInformation",
                },
              }}
              row={actionData.data}
            />
          </>
        )}
      </Grid>
    </Container>
  );
};

Page.getLayout = (page) => (
  <DashboardLayout>
    <TabbedLayout tabOptions={tabOptions}>{page}</TabbedLayout>
  </DashboardLayout>
);

export default Page;
