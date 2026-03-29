import { Command } from 'commander';
import { listVoices, VoicesManager } from 'edge-tts-universal';

export function registerVoicesCommand(program: Command): void {
  program
    .command('voices')
    .description('List all available Edge TTS voices')
    .option('-l, --lang <language>', 'Filter by language code (e.g., en, zh, de)')
    .option('-g, --gender <gender>', 'Filter by gender (Male, Female)')
    .option('-f, --full', 'Show full voice list without grouping')
    .action(async (options: any) => {
      try {
        console.log('Fetching available voices...');
        const voicesManager = await VoicesManager.create();
        
        let voices = voicesManager.find({});
        
        // Apply filters
        if (options.lang) {
          const langFilter = options.lang.toLowerCase();
          voices = voicesManager.find({ Language: langFilter });
        }
        
        if (options.gender) {
          const genderFilter = options.gender.charAt(0).toUpperCase() + options.gender.slice(1).toLowerCase();
          if (genderFilter === 'Male' || genderFilter === 'Female') {
            voices = voices.filter((v: any) => v.Gender === genderFilter);
          } else {
            console.error('Gender must be Male or Female');
            process.exit(1);
          }
        }
        
        if (options.full) {
          // Show full flat list
          console.log(`\n${voices.length} voices found:\n`);
          for (const voice of voices) {
            const genderIcon = voice.Gender === 'Female' ? '♀' : '♂';
            console.log(`  ${voice.ShortName.padEnd(40)} ${genderIcon} ${voice.Locale}`);
          }
          return;
        }
        
        // Group by language/region
        const byLocale: Record<string, any[]> = {};
        for (const voice of voices) {
          const locale = voice.Locale;
          if (!byLocale[locale]) byLocale[locale] = [];
          byLocale[locale].push(voice);
        }
        
        // Sort locales
        const sortedLocales = Object.keys(byLocale).sort();
        
        console.log(`\n${voices.length} voices found in ${sortedLocales.length} locales:\n`);
        
        for (const locale of sortedLocales) {
          const localeVoices = byLocale[locale];
          // Get language name from locale
          const langCode = locale.split('-')[0];
          
          console.log(`🌐 ${locale} (${langCode}) — ${localeVoices.length} voices`);
          for (const voice of localeVoices) {
            const genderIcon = voice.Gender === 'Female' ? '♀' : '♂';
            console.log(`   ${genderIcon} ${voice.ShortName}`);
          }
          console.log('');
        }
      } catch (err: any) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });
}